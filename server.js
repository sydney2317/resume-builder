import express from "express"
import cors from "cors"
import "dotenv/config"
import sqlite3 from "sqlite3"
import { GoogleGenAI } from "@google/genai"
import path from "path"
import { fileURLToPath } from "url"

const app = express()
const HTTP_PORT = 8000
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const strModel = "gemini-2.5-flash"

app.use(cors())
app.use(express.json())
app.use(express.static(__dirname))

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"))
})

//Set up database
const dbResume = new sqlite3.Database("Resumes.db", (objError) => {
    if (objError) {
        console.error("Error opening database:", objError.message)
    } else {
        console.log("Connected to Resumes.db")
    }
})

//Extracts and returns a configured GoogleGenAI instance based on the request's API key
function getGenAIFromRequest(req) {
    //Pull the user's API key from the request header
    //Ensure it is a string before trimming. otherwise default to an empty string
    const strUserApiKey = typeof req.headers["x-api-key"] === "string"? req.headers["x-api-key"].trim(): ""
    // If the user provided an API key, use it.otherwise, use personal key
    const strApiKeyToUse = strUserApiKey || process.env.GEMINI_API_KEY
    // If neither the user nor the server has an API key available, stop immediately
    if (!strApiKeyToUse) {throw new Error("No API key is available.")}
    //Create and return a new GoogleGenAI client configured with the selected API key
    return new GoogleGenAI({apiKey: strApiKeyToUse})
}


//This function is used for all user input sections. The AI will look for grammer and professionalism and give suggestions to user before they submit to database
//send the section being reviewed to the function
//send the user-provided data to the function
async function getAISuggestions(req, strSection, objUserInfo) {
    //this is the prompt being sent to the AI
    try {
        // Retrieve a configured GenAI client instance based on the incoming request
        const objGenAI = getGenAIFromRequest(req)
        // Build a strict, instruction-driven prompt that gives users suggestions on their information inputs
        const strPrompt = ` 
            Review this user information for their resume and return JSON only:
            {"suggestions":["suggestion 1","suggestion 2"]}

            Rules:
            - Give 1-2, practical suggestions.
            - Focus on grammar, clarity, professionalism, and stronger wording.
            - Do not give suggestions on dates entered
            - If the data already looks good, still provide improvement ideas but do not suggest adding links.
            - Do not include markdown.
            - Do not include any text outside JSON.

            Section: ${strSection}      
            Data: ${JSON.stringify(objUserInfo)}`
        //inserts the value of the variable strSection directly into the prompt string ^^
        //converts the objUserInfo object into a JSON string and inserts it into the prompt^^

    // Send the prompt to the AI model and wait for its response.
    const objResponse = await objGenAI.models.generateContent({
        model: strModel,        //selects what model to use. In our case its gemini-2.5-flash
        contents: strPrompt     //send the full prompt string
    })
    //this is the text returned by the AI
    //the default is an empty string 
    const strText = objResponse.text ? objResponse.text.trim() : ""

    let strClean = strText  

    strClean = strClean
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .replace(/^[^{]*/, "")
        .replace(/[^}]*$/, "")
        .trim()

    //parse the response into a json object
    //required because the AI returns text, not an actual object
    let objParsed

        try {
            //convert the cleaned JSON string into an object.
            objParsed = JSON.parse(strClean)    //parse AFTER cleaning
        } catch (err) {
            //If parsing fails, log the AI output for debugging
            console.error("Failed raw AI output:", strText)
            throw new Error("AI returned invalid JSON format.")
        }
        //Check that the parsed object contains a "suggestions" property
        //AND that the property is an array. If not, return a fallback message.        
        if (!objParsed.suggestions || !Array.isArray(objParsed.suggestions)) {
            return ["AI suggestions were unavailable."]
        }
        //If everything is valid, return the suggestions array to the caller.
        return objParsed.suggestions

    } catch (objError) {
        // Catch any unexpected errors in the entire block above.
        console.error("AI suggestion error:", objError.message)
        return ["AI suggestions were unavailable."]
    }
}
//------------------------USERS FUNCTIONS------------------------------------------
//used to get all information from the users table
app.get("/api/users", (req, res) => {
    const strQuery = "SELECT * FROM Users" //retreives every row from this table
    //executes query against the database
    dbResume.all(strQuery, [], (objError, arrRows) => {
        //if there is an error, return what the error is
        if (objError) {
            return res.status(500).json({
                outcome: "error",
                message: objError.message
            })
        }
        //otherwise return with all user entries and an ok status
        res.status(200).json(arrRows)
    })
})

//AI was used to ensure this route worked and to debug
//this post route is used for users to review their entered information before it is saved
app.post("/api/users/review", async (req, res) => {
    //convert each variable to a sting. otherwise default is an empty string
    const strFirstName = typeof req.body.firstName === "string" ? req.body.firstName.trim() : ""
    const strLastName = typeof req.body.lastName === "string" ? req.body.lastName.trim() : ""
    const strEmail = typeof req.body.email === "string" ? req.body.email.trim() : ""
    const strPhone = typeof req.body.phone === "string" ? req.body.phone.trim() : ""
    const strAddress = typeof req.body.address === "string" ? req.body.address.trim() : ""

    //validation check to ensure the required fields are entered
    if (!strFirstName || !strLastName || !strEmail) {
        return res.status(400).json({
            outcome: "error",
            message: "firstName, lastName, and email are required"
        })
    }
    //send the entered information to the AISuggestions function for review
    const arrAISuggestions = await getAISuggestions(req, "Users", {
        firstName: strFirstName,
        lastName: strLastName,
        email: strEmail,
        phone: strPhone,
        address: strAddress
    })
    //return the AI suggestions to user
    res.status(200).json({
        outcome: "success",
        aiSuggestions: arrAISuggestions
    })
})

//AI was used to create this route
//this post route is used for users to enter their information into the database
app.post("/api/users", (req, res) => {
    //convert each variable to a sting. otherwise default is an empty string  
    const strFirstName = typeof req.body.firstName === "string" ? req.body.firstName.trim() : ""
    const strLastName = typeof req.body.lastName === "string" ? req.body.lastName.trim() : ""
    const strEmail = typeof req.body.email === "string" ? req.body.email.trim() : ""
    const strPhone = typeof req.body.phone === "string" ? req.body.phone.trim() : ""
    const strAddress = typeof req.body.address === "string" ? req.body.address.trim() : ""

    //validation check to ensure the required fields are entered
    if (!strFirstName || !strLastName || !strEmail) {
        return res.status(400).json({
            outcome: "error",
            message: "firstName, lastName, and email are required."
        })
    }
    //SQL INSERT statement
    const strQuery = `INSERT INTO Users (first_name, last_name, email, phone_number, address) VALUES (?, ?, ?, ?, ?)`
    
    //Execute the INSERT query
    dbResume.run(strQuery,[strFirstName, strLastName, strEmail, strPhone, strAddress],function (objError) {
        //if there is an error, print error to the screen and return a 500 error status
        if (objError) {
            return res.status(500).json({
                outcome: "error",
                message: objError.message
            })
        }
        //return a sucess message to user and a 201 sucess status
        res.status(201).json({
            outcome: "success",
            message: "User created successfully.",
            userId: this.lastID //this is the primary key of the row that was just inserted
        })
    })
})


//------------------------EDUCATION FUNCTIONS------------------------------------------
//used to get all information from the education table
app.get("/api/education", (req, res) => {
    const strQuery = "SELECT * FROM Education" //retreives every row from this table

    //executes query against the database
    dbResume.all(strQuery, [], (objError, arrRows) => {
        //if there is an error, return what the error is
        if (objError) {
            return res.status(500).json({
                outcome: "error",
                message: objError.message
            })
        }
        //otherwise return with all education entries and an ok status
        res.status(200).json(arrRows)
    })
})


//AI was used to ensure this route worked and to debug
//this post route is used for users to review their entered education information before it is saved
app.post("/api/education/review", async (req, res) => {
    //convert each variable to a string. otherwise default is an empty string
    const strSchoolName = typeof req.body.schoolName === "string" ? req.body.schoolName.trim() : ""
    const strDegree = typeof req.body.degree === "string" ? req.body.degree.trim() : ""
    const strMajor = typeof req.body.major === "string" ? req.body.major.trim() : ""
    const strGraduationYear = typeof req.body.graduationYear === "string" ? req.body.graduationYear.trim() : ""

    //validation check to ensure the required fields are entered
    if (!strSchoolName || !strDegree || !strMajor) {
        return res.status(400).json({
            outcome: "error",
            message: "schoolName, degree, and major are required"
        })
    }

    //send the entered information to the AISuggestions function for review
    const arrAISuggestions = await getAISuggestions(req,"Education", {
        schoolName: strSchoolName,
        degree: strDegree,
        major: strMajor,
        graduationYear: strGraduationYear
    })

    //return the AI suggestions to user
    res.status(200).json({
        outcome: "success",
        aiSuggestions: arrAISuggestions
    })
})

//AI was used to create this route
//this post route is used for users to enter their education information into the database
app.post("/api/education", (req, res) => {
    //convert each variable to a string. otherwise default is an empty string
    const strSchoolName = typeof req.body.schoolName === "string" ? req.body.schoolName.trim() : ""
    const strDegree = typeof req.body.degree === "string" ? req.body.degree.trim() : ""
    const strMajor = typeof req.body.major === "string" ? req.body.major.trim() : ""
    const strGraduationYear = typeof req.body.graduationYear === "string" ? req.body.graduationYear.trim() : ""

    //validation check to ensure the required fields are entered
    if (!strSchoolName || !strDegree || !strMajor) {
        return res.status(400).json({
            outcome: "error",
            message: "schoolName, degree, and major are required."
        })
    }

    //SQL INSERT statement
    const strQuery = `INSERT INTO Education (school_name, degree, major, graduation_year) VALUES (?, ?, ?, ?)`

    //Execute the INSERT query
    dbResume.run(strQuery, [strSchoolName, strDegree, strMajor, strGraduationYear], function (objError) {
        //if there is an error, print error to the screen and return a 500 error status
        if (objError) {
            return res.status(500).json({
                outcome: "error",
                message: objError.message
            })
        }
        //return a success message to user and a 201 success status
        res.status(201).json({
            outcome: "success",
            message: "Education created successfully.",
            educationId: this.lastID //this is the primary key of the row that was just inserted
        })
    })
})


//------------------------JOB FUNCTIONS------------------------------------------
//used to get all information from the jobs table
app.get("/api/jobs", (req, res) => {
    
    const strQuery = "SELECT * FROM Jobs"   //retreives every row from this table
    //executes query against the database
    dbResume.all(strQuery, [], (objError, arrRows) => {
        //if there is an error, return what the error is
        if (objError) {
            return res.status(500).json({
                outcome: "error",
                message: objError.message
            })
        }
        //otherwise return with all education entries and an ok status
        res.status(200).json(arrRows)
    })
})

//AI was used to create this route
//this post route is used for users to enter their job information into the database
app.post("/api/jobs", (req, res) => {
    //convert each variable to a string. otherwise default is an empty string
    const strJobTitle = typeof req.body.jobTitle === "string" ? req.body.jobTitle.trim() : ""
    const strCompany = typeof req.body.company === "string" ? req.body.company.trim() : ""

    //validation check to ensure the required fields are entered
    if (!strJobTitle || !strCompany) {
        return res.status(400).json({
            outcome: "error",
            message: "job title and company are required."
        })
    }
    //SQL INSERT statement
    const strQuery = `INSERT INTO Jobs (job_title, company_name) VALUES (?, ?)`
    //Execute the INSERT query
    dbResume.run(strQuery, [strJobTitle, strCompany], function (objError) {
        //if there is an error, print error to the screen and return a 500 error status
        if (objError) {
            return res.status(500).json({
                outcome: "error",
                message: objError.message
            })
        }
        //return a success message to user and a 201 success status
        res.status(201).json({
            outcome: "success",
            message: "Job created successfully.",
            jobId: this.lastID //this is the primary key of the row that was just inserted
        })
    })
})

//AI was used to ensure this route worked and to debug
//this post route is used for users to review their entered job information before it is saved
app.post("/api/jobs/review", async (req, res) => {
    //convert each variable to a string. otherwise default is an empty string
    const strJobTitle = typeof req.body.jobTitle === "string" ? req.body.jobTitle.trim() : ""
    const strCompany = typeof req.body.company === "string" ? req.body.company.trim() : ""
    
    //validation check to ensure the required fields are entered
    if (!strJobTitle || !strCompany) {
        return res.status(400).json({
            outcome: "error",
            message: "Job title and company are required"
        })
    }

    //send the entered information to the AISuggestions function for review
    const arrAISuggestions = await getAISuggestions(req,"Jobs", {
        jobTitle: strJobTitle,
        company: strCompany
    })

    //return the AI suggestions to user
    res.status(200).json({
        outcome: "success",
        aiSuggestions: arrAISuggestions
    })
})



//------------------------JOB RESPONSIBILITY FUNCTIONS------------------------------------------

//used to get all information from the job responsibility table
app.get("/api/responsibilities", (req, res) => {
    const strQuery = "SELECT * FROM Responsibilities" //retreives every row from this table
    //executes query against the database
    dbResume.all(strQuery, [], (objError, arrRows) => {
        //if there is an error, return what the error is
        if (objError) {
            return res.status(500).json({
                outcome: "error",
                message: objError.message
            })
        }
        //otherwise return with all education entries and an ok status
        res.status(200).json(arrRows)
    })
})

//AI was used create this route
//this post route is used for users to review their entered job responsibility information before it is saved
app.post("/api/responsibilities/review", async (req, res) => {
    try {
        //convert each variable to a string. otherwise default is an empty string
        const intJobId = typeof req.body.jobId === "number"? req.body.jobId: parseInt(req.body.jobId)
        const strResponsibility = typeof req.body.responsibility === "string"? req.body.responsibility.trim(): ""

        //validation check to ensure the required fields are entered
        if (!intJobId || !strResponsibility) {
            return res.status(400).json({
                outcome: "error",
                message: "Job selection and responsibility are required"
            })
        }

        //get job details for better AI context
        const strJobQuery = `SELECT job_title, company_name FROM Jobs WHERE job_id = ?`
        dbResume.get(strJobQuery, [intJobId], async (err, row) => {
            // If the database returns an error, log it and send a 500 response
            if (err) {
                return res.status(500).json({
                    outcome: "error",
                    message: err.message
                })
            }
            // If no job exists with the given ID, return a 404 response
            if (!row) {
                return res.status(404).json({
                    outcome: "error",
                    message: "Job not found"
                })
            }

            // Send expanded job context to the AI so it can generate more accurate suggestions
            const arrAISuggestions = await getAISuggestions(req, "Responsibilities", {
                jobTitle: row.job_title,
                company: row.company_name,
                responsibility: strResponsibility
            })
            // Return the AI suggestions to the client
            return res.status(200).json({
                outcome: "success",
                aiSuggestions: arrAISuggestions
            })
        })

    }catch (err) {
        // Catch any unexpected errors and return a 500 response
        return res.status(500).json({
            outcome: "error",
            message: err.message
        })
    }
})

//AI was used create this route
//this post route is used for users to enter their job responsibility information into the database
app.post("/api/responsibilities", (req, res) => {
    // Extract the jobId from the request body.
    const intJobId = typeof req.body.jobId === "number" ? req.body.jobId : parseInt(req.body.jobId)
    // Extract the responsibility text.
    // Ensure it's a string before trimming; otherwise default to an empty string.
    const strResponsibility = typeof req.body.responsibility === "string" ? req.body.responsibility.trim(): ""

    // Validate required fields
    if (!intJobId || !strResponsibility) {
        return res.status(400).json({
            outcome: "error",
            message: "Job and responsibility are required."
        })
    }

    // SQL statement to insert a new responsibility linked to a job
    const strQuery = `INSERT INTO Responsibilities (job_id, description) VALUES (?, ?)`
    dbResume.run(strQuery, [intJobId, strResponsibility], function (objError) {
        //if the database returns an error, log it and send a 500 response
        if (objError) {
            console.error(objError)
            return res.status(500).json({
                outcome: "error",
                message: objError.message
            })
        }
        //return a 201: Created response with the new responsibility ID
        return res.status(201).json({
            outcome: "success",
            message: "Responsibility saved successfully.",
            responsibilityId: this.lastID
        })
    })
})


//------------------------Skills FUNCTIONS------------------------------------------
//used to get all information from the skills table
app.get("/api/skills", (req, res) => {
    const strQuery = "SELECT * FROM Skills" //retreives every row from this table
    //executes query against the database
    dbResume.all(strQuery, [], (objError, arrRows) => {
        //if there is an error, return what the error is
        if (objError) {
            return res.status(500).json({
                outcome: "error",
                message: objError.message
            })
        }
        //otherwise return with all education entries and an ok status
        res.status(200).json(arrRows)
    })
})


//AI was used to ensure this route worked and to debug
//this post route is used for users to review their entered skill information before it is saved
app.post("/api/skills/review", async (req, res) => {
    //convert each variable to a string. otherwise default is an empty string
    const strSkillName = typeof req.body.skillName === "string" ? req.body.skillName.trim() : ""
    
    //validation check to ensure the required fields are entered
    if (!strSkillName) {
        return res.status(400).json({
            outcome: "error",
            message: "Skill is required"
        })
    }

    //send the entered information to the AISuggestions function for review
    const arrAISuggestions = await getAISuggestions(req,"Skills", {
        skillName: strSkillName
    })

    //return the AI suggestions to user
    res.status(200).json({
        outcome: "success",
        aiSuggestions: arrAISuggestions
    })
})

//AI was used to create this route
//this post route is used for users to enter their skill information into the database
app.post("/api/skills", (req, res) => {
    //convert each variable to a string. otherwise default is an empty string
    const strSkillName = typeof req.body.skillName === "string" ? req.body.skillName.trim() : ""

    //validation check to ensure the required fields are entered
    if (!strSkillName) {
        return res.status(400).json({
            outcome: "error",
            message: "job title and company are required."
        })
    }
    //SQL INSERT statement
    const strQuery = `INSERT INTO Skills (skill_name) VALUES (?)`
    //Execute the INSERT query
    dbResume.run(strQuery, [strSkillName], function (objError) {
        //if there is an error, print error to the screen and return a 500 error status
        if (objError) {
            return res.status(500).json({
                outcome: "error",
                message: objError.message
            })
        }
        //return a success message to user and a 201 success status
        res.status(201).json({
            outcome: "success",
            message: "skill created successfully.",
            skillId: this.lastID //this is the primary key of the row that was just inserted
        })
    })
})



//------------------------CERTIFICATES FUNCTIONS------------------------------------------
//used to get all information from the certificates table
app.get("/api/certificates", (req, res) => {
    const strQuery = "SELECT * FROM Certificates" //retreives every row from this table
    //executes query against the database
    dbResume.all(strQuery, [], (objError, arrRows) => {
        //if there is an error, return what the error is
        if (objError) {
            return res.status(500).json({
                outcome: "error",
                message: objError.message
            })
        }
        //otherwise return with all education entries and an ok status
        res.status(200).json(arrRows)
    })
})

//AI was used to create this route
//this post route is used for users to enter their certificate information into the database
app.post("/api/certificates", (req, res) => {
    //convert each variable to a string. otherwise default is an empty string
    const strCertificateName = typeof req.body.certificateName === "string" ? req.body.certificateName.trim() : ""
    const strOrganization = typeof req.body.organization === "string" ? req.body.organization.trim() : ""
    const strIssueDate = typeof req.body.issueDate === "string" ? req.body.issueDate.trim() : ""
    
     //validation check to ensure the required fields are entered
    if (!strCertificateName || !strOrganization) {
        return res.status(400).json({
            outcome: "error",
            message: "Certification name and organization are required."
        })
    }
    //SQL INSERT statement
    const strQuery = `INSERT INTO Certificates (certificate_name, issuing_organization, issue_date) VALUES (?, ?, ?)`
    //Execute the INSERT query
    dbResume.run(strQuery, [strCertificateName, strOrganization, strIssueDate], function (objError) {
        //if there is an error, print error to the screen and return a 500 error status
        if (objError) {
            return res.status(500).json({
                outcome: "error",
                message: objError.message
            })
        }
        //return a success message to user and a 201 success status
        res.status(201).json({
            outcome: "success",
            message: "Certification created successfully.",
            certificateId: this.lastID //this is the primary key of the row that was just inserted
        })
    })
})
//AI was used to ensure this route worked and to debug
//this post route is used for users to review their entered certificate information before it is saved
app.post("/api/certificates/review", async (req, res) => {
    //convert each variable to a string. otherwise default is an empty string
    const strCertificateName = typeof req.body.certificateName === "string" ? req.body.certificateName.trim() : ""
    const strOrganization = typeof req.body.organization === "string" ? req.body.organization.trim() : ""
    const strIssueDate = typeof req.body.issueDate === "string" ? req.body.issueDate.trim() : ""

    //validation check to ensure the required fields are entered
    if (!strCertificateName || !strOrganization) {
        return res.status(400).json({
            outcome: "error",
            message: "Certificate name and organization are required"
        })
    }

    //send the entered information to the AISuggestions function for review
    const arrAISuggestions = await getAISuggestions(req, "Certificates", {
        certificateName: strCertificateName,
        organization: strOrganization,
        issueDate: strIssueDate
    })

    //return the AI suggestions to user
    res.status(200).json({
        outcome: "success",
        aiSuggestions: arrAISuggestions
    })
})


//------------------------AWARDS FUNCTIONS------------------------------------------
//used to get all information from the awards table
app.get("/api/awards", (req, res) => {
    const strQuery = "SELECT * FROM Awards" //retreives every row from this table
    //executes query against the database
    dbResume.all(strQuery, [], (objError, arrRows) => {
        //if there is an error, return what the error is
        if (objError) {
            return res.status(500).json({
                outcome: "error",
                message: objError.message
            })
        }
        //otherwise return with all education entries and an ok status
        res.status(200).json(arrRows)
    })
})


//AI was used to create this route
//this post route is used for users to enter their award information into the database
app.post("/api/awards", (req, res) => {
    //convert each variable to a string. otherwise default is an empty string
    const strAwardName = typeof req.body.awardName === "string" ? req.body.awardName.trim() : ""
    const strOrganization = typeof req.body.organization === "string" ? req.body.organization.trim() : ""
    const strIssueDate = typeof req.body.issueDate === "string" ? req.body.issueDate.trim() : ""
    
     //validation check to ensure the required fields are entered
    if (!strAwardName || !strOrganization) {
        return res.status(400).json({
            outcome: "error",
            message: "Award name and organization are required."
        })
    }
    //SQL INSERT statement
    const strQuery = `INSERT INTO Awards (award_name, organization, date_received) VALUES (?, ?, ?)`
    //Execute the INSERT query
    dbResume.run(strQuery, [strAwardName, strOrganization, strIssueDate], function (objError) {
        //if there is an error, print error to the screen and return a 500 error status
        if (objError) {
            return res.status(500).json({
                outcome: "error",
                message: objError.message
            })
        }
        //return a success message to user and a 201 success status
        res.status(201).json({
            outcome: "success",
            message: "Award created successfully.",
            awardId: this.lastID //this is the primary key of the row that was just inserted
        })
    })
})
//AI was used to ensure this route worked and to debug
//this post route is used for users to review their entered award information before it is saved
app.post("/api/awards/review", async (req, res) => {
    //convert each variable to a string. otherwise default is an empty string
    const strAwardName = typeof req.body.awardName === "string" ? req.body.awardName.trim() : ""
    const strOrganization = typeof req.body.organization === "string" ? req.body.organization.trim() : ""
    const strIssueDate = typeof req.body.issueDate === "string" ? req.body.issueDate.trim() : ""

    //validation check to ensure the required fields are entered
    if (!strAwardName || !strOrganization) {
        return res.status(400).json({
            outcome: "error",
            message: "Award name and organization are required"
        })
    }

    //send the entered information to the AISuggestions function for review
    const arrAISuggestions = await getAISuggestions(req, "Awards", {
        awardName: strAwardName,
        organization: strOrganization,
        issueDate: strIssueDate
    })

    //return the AI suggestions to user
    res.status(200).json({
        outcome: "success",
        aiSuggestions: arrAISuggestions
    })
})

//Executes a SQL query using dbResume.all() and returns the results as a Promise.
//This helper function wraps the sqlite3 database info inside a Promise so the rest of the backend can use async/await syntax.
function runAllQuery(strQuery, arrParams = []) {
    return new Promise((resolve, reject) => {
        // Execute the SQL query using sqlite3 .all() 
        dbResume.all(strQuery, arrParams, (objError, arrRows) => {
            // If sqlite returns an error, reject the Promise so the caller
            // can handle it with try/catch or .catch().
            if (objError) {
                reject(objError)
            } else {
                //resolve the Promise with the array of rows.
                resolve(arrRows)
            }
        })
    })
}

//Builds a parameter placeholder string for use inside a SQL IN(...) clause
function buildInClause(arrValues) {
    // Convert each element into a "?" placeholder, then join them with commas.
    return arrValues.map(() => "?").join(",")
}

//Generates a fully formatted resume in HTML using a GenAI model and the provided resume data
async function generateResumeText(req, objResumeData) {
    try {
        const objGenAI = getGenAIFromRequest(req)
        // Builds a strict, instruction-driven prompt that builds a resume for the user
        const strPrompt = `
            Create a polished, professional, ATS-friendly resume using ONLY the information provided.

            OUTPUT REQUIREMENTS:

            Return ONLY valid HTML code.

            The response MUST:
            - Start with <!DOCTYPE html>
            - Include <html>, <head>, and <body> tags
            - Use proper HTML elements like <h1>, <h2>, <p>, <ul>, <li>
            - Include a <style> section inside <head>
            - NOT include markdown 

            If the output is not valid HTML, it is incorrect.

            The layout must fit cleanly on 8.5 x 11 inches (US Letter).
            Use black text on white background (printer-friendly).
            Use standard, ATS-safe fonts (e.g., Arial, Calibri, Helvetica).
            Ensure proper margins and spacing for printing.
            Do NOT include any explanations—ONLY return the final HTML.


            Use only:
            - <div> for blocks
            - <strong> for headings
            - plain text separated by single line breaks

            Avoid all default HTML elements that add spacing.

            STRUCTURE:

            FULL NAME
            Email | Phone | City, State (no full address unless provided)

            PROFESSIONAL SUMMARY

            2-3 concise sentences
            Focus on strengths, experience, and career direction
            No first-person pronouns

            EDUCATION

            Degree, Major — School Name
            Graduation Date (or Expected)
            GPA only if provided

            PROFESSIONAL EXPERIENCE
            For each role:
            Job Title — Company Name
            Dates (Month Year - Month Year or Present)

            2-5 bullet points
            Start with strong action verbs
            Focus on impact/results
            Past tense (previous roles), present tense (current role)
            Avoid repeated verbs

            SKILLS

            Group logically (Technical Skills, Tools, Languages, etc.)
            Use clean bullet or comma-separated format
            No soft skills unless explicitly provided

            CERTIFICATIONS (if provided)
            AWARDS (if provided)

            STRICT RULES:

            Do NOT invent or assume information
            Do NOT include placeholders like "[Your Name]"
            Omit empty sections entirely
            Keep wording concise and professional
            Avoid generic phrases unless supported
            No repeated phrasing
            Perfect grammar and punctuation

            STYLE GUIDELINES:

            Clean, minimal layout
            Easy to scan quickly
            Consistent spacing and alignment
            Clear section headings

            PRINT STYLING REQUIREMENTS:

            Use CSS @page for margins
            Ensure no content is cut off when printed
            Avoid unnecessary colors, graphics, or icons
            Use subtle section dividers (lines or spacing)

            FINAL CHECK:

            Fully formatted and print-ready
            No empty sections
            Clean, consistent layout
            Looks like a finished, ready-to-submit resume
            Selected resume data:
            ${JSON.stringify(objResumeData, null, 2)}`

        // Call the GenAI model with the constructed prompt.
        // The response is expected to contain the generated HTML in a .text property.      
        const objResponse = await objGenAI.models.generateContent({
            model: strModel,
            contents: strPrompt
        })
        // If objResponse.text is missing, fall back to an empty string.
        const strResumeText = objResponse.text ? objResponse.text.trim() : ""
        // Validate that the model actually returned some content.
        if (!strResumeText) {
            throw new Error("AI returned an empty resume.")
        }
        // Return the final, trimmed HTML resume string to the caller.
        return strResumeText

    }catch (objError) {
        // Log the error message for server-side debugging.
        console.error("Resume generation error:", objError.message)
        // Throw a generic, user-friendly error message so the client does not see internal details but knows to try again later.
        throw new Error("AI is busy right now. Please try generating the resume again in a moment.")
    }
}



app.post("/api/resumes/generate", async (req, res) => {
    //Convert the incoming userId to a number so it can be validated and used in SQL
    const intUserID = Number(req.body.userId)
    //Extract resumeName. ensure it's a string and remove surrounding whitespace
    const strResumeName = typeof req.body.resumeName === "string" ? req.body.resumeName.trim() : ""

    //Extract arrays of IDs from the request body.If the value is not an array, default to an empty array
    const arrEducationIDs = Array.isArray(req.body.educationIds) ? req.body.educationIds : []
    const arrJobIDs = Array.isArray(req.body.jobIds) ? req.body.jobIds : []
    const arrResponsibilityIDs = Array.isArray(req.body.responsibilityIds) ? req.body.responsibilityIds : []
    const arrSkillIDs = Array.isArray(req.body.skillIds) ? req.body.skillIds : []
    const arrCertificateIDs = Array.isArray(req.body.certificateIds) ? req.body.certificateIds : []
    const arrAwardIDs = Array.isArray(req.body.awardIds) ? req.body.awardIds : []

    //Validate that userId is a valid integer and resumeName is not empty.
    if (!Number.isInteger(intUserID) || !strResumeName) {
        return res.status(400).json({
            outcome: "error",
            message: "resumeName and valid userId are required."
        })
    }
    try {
        //Query the Users table for the provided userId.
        const arrUsers = await runAllQuery("SELECT * FROM Users WHERE user_id = ?", [intUserID])
        //If education IDs were provided, fetch matching rows
        //buildInClause() generates the correct number of "?" placeholders
        const arrEducation = arrEducationIDs.length ? await runAllQuery(`SELECT * FROM Education WHERE education_id IN (${buildInClause(arrEducationIDs)})`, arrEducationIDs) : []
        //Fetch job records if job IDs were provided
        const arrJobs = arrJobIDs.length ? await runAllQuery(`SELECT * FROM Jobs WHERE job_id IN (${buildInClause(arrJobIDs)})`, arrJobIDs) : []
        //Fetch responsibility records if responsibility IDs were provided
        const arrResponsibilities = arrResponsibilityIDs.length ? await runAllQuery(`SELECT * FROM Responsibilities WHERE responsibility_id IN (${buildInClause(arrResponsibilityIDs)})`, arrResponsibilityIDs) : []
        //Fetch skill records if skill IDs were provided
        const arrSkills = arrSkillIDs.length ? await runAllQuery(`SELECT * FROM Skills WHERE skill_id IN (${buildInClause(arrSkillIDs)})`, arrSkillIDs) : []
        //Fetch certificate records if certificate IDs were provided
        const arrCertificates = arrCertificateIDs.length ? await runAllQuery(`SELECT * FROM Certificates WHERE certificate_id IN (${buildInClause(arrCertificateIDs)})`, arrCertificateIDs) : []
        //Fetch award records if award IDs were provided
        const arrAwards = arrAwardIDs.length ? await runAllQuery(`SELECT * FROM Awards WHERE award_id IN (${buildInClause(arrAwardIDs)})`, arrAwardIDs) : []
        //Build a single object containing all fetched data
        const objResumeData = {
            resumeName: strResumeName,
            user: arrUsers[0] || null,
            education: arrEducation,
            jobs: arrJobs,
            responsibilities: arrResponsibilities,
            skills: arrSkills,
            certificates: arrCertificates,
            awards: arrAwards
        }
        //Generate the resume HTML using the AI model
        const strResumeText = await generateResumeText(req, objResumeData)
        //Insert the generated resume into the Resumes table
        dbResume.run(
            `INSERT INTO Resumes (user_id, resume_name, resume_text) VALUES (?, ?, ?)`,
            [intUserID, strResumeName, strResumeText],
            function (objError) {
                // If the INSERT failed, return a 500 error
                if (objError) {
                    return res.status(500).json({
                        outcome: "error",
                        message: objError.message
                    })
                }
                //send back the new resume ID and the generated HTML
                res.status(201).json({
                    outcome: "success",
                    resumeId: this.lastID,  //sqlite3 stores the ID of the inserted row
                    resumeText: strResumeText
                })
            }
        )
    } catch (objError) {
        //Catch any errors thrown during database queries or AI generation
        res.status(500).json({
            outcome: "error",
            message: objError.message
        })
    }
})

app.get("/api/resumes", (req, res) => {
    //Define the SQL query string that selects all rows from the Resumes table
    const strQuery = "SELECT * FROM Resumes"
    //Execute the SQL query
    dbResume.all(strQuery, [], (objError, arrRows) => {
        if (objError) {
            //If sqlite returns an error, send a 500 response with the error message
            return res.status(500).json({
                outcome: "error",
                message: objError.message
            })
        }
        //send back the array of resume rows with a 200 status
        res.status(200).json(arrRows)
    })
})

app.get("/api/resumes/:resumeid", (req, res) => {
    // Convert the route parameter (:resumeid) from a string into a number
    const intResumeID = Number(req.params.resumeid)
    // Check that the converted value is a valid integer.
    if (!Number.isInteger(intResumeID)) {
        return res.status(400).json({
            outcome: "error",
            message: "Valid resume_id is required."
        })
    }
    //Execute the SQL query
    dbResume.all("SELECT * FROM Resumes WHERE resume_id = ?", [intResumeID], (objError, arrRows) => {
        if (objError) {
            //If sqlite returns an error, send a 500 response with the error message
            return res.status(500).json({
                outcome: "error",
                message: objError.message
            })
        }
        //send back the array of resume rows with a 200 status
        res.status(200).json(arrRows)
    })
})

app.listen(HTTP_PORT, () => {
    console.log(`Server running at http://localhost:${HTTP_PORT}`)
})