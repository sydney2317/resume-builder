document.addEventListener("DOMContentLoaded", () => {
    //main section containers
    const divHome = document.querySelector("#divHome")
    const divAddInfo = document.querySelector("#divAddInfo")
    const divAddPersonalInfoCard = document.querySelector("#divAddPersonalInfoCard");
    const divAddEducationInfoCard = document.querySelector("#divAddEducationInfoCard");
    const divAddJobInfoCard = document.querySelector("#divAddJobInfoCard");
    const divAddJobResCard = document.querySelector("#divAddJobResCard");
    const divAddSkillsCard = document.querySelector("#divAddSkillsCard");
    const divAddAwardCard = document.querySelector("#divAddAwardCard");
    const divAddCertificateCard = document.querySelector("#divAddCertificateCard");
    const divBuildResume = document.querySelector("#divBuildResume")
    const divSavedResumes = document.querySelector("#divSavedResumes")

    //hide all screen function. this is used many times thorughout this file
    function hideAllScreens() {
            divHome.classList.add("d-none")
            divAddInfo.classList.add("d-none")
            divAddPersonalInfoCard.classList.add("d-none")
            divAddEducationInfoCard.classList.add("d-none")
            divAddJobInfoCard.classList.add("d-none")
            divAddJobResCard.classList.add("d-none")
            divAddSkillsCard.classList.add("d-none")
            divAddCertificateCard.classList.add("d-none")
            divAddAwardCard.classList.add("d-none")
            divBuildResume.classList.add("d-none")
            divSavedResumes.classList.add("d-none")

            divHome.classList.remove("d-flex")
            divAddInfo.classList.remove("d-flex")
            divAddPersonalInfoCard.classList.remove("d-flex")
            divAddEducationInfoCard.classList.remove("d-flex")
            divAddJobInfoCard.classList.remove("d-flex")
            divAddJobResCard.classList.remove("d-flex")
            divAddSkillsCard.classList.remove("d-flex")
            divAddCertificateCard.classList.remove("d-flex")
            divAddAwardCard.classList.remove("d-flex")
            divBuildResume.classList.remove("d-flex")
            divSavedResumes.classList.remove("d-flex")
    }
    //takes user from the add information screen back to the main menu
    document.querySelector('#btnBackHome').addEventListener('click', () => {
        hideAllScreens()
        divHome.classList.remove("d-none")
    })
    //This takes the user from the main menu to the add information screen
    document.querySelector('#btnAddInfo').addEventListener('click', () => {
        hideAllScreens()
        divAddInfo.classList.remove("d-none")
        divAddInfo.classList.add('d-flex')
    })
    //---------------------------Personal info section---------------------------

    //Transition from Options Menu to Personal Info Form
    document.querySelector('#btnGoToPersonal').addEventListener('click', () => {
        hideAllScreens()
        divAddPersonalInfoCard.classList.remove("d-none")
        divAddPersonalInfoCard.classList.add("d-flex")
    })

    //Back button from Personal Info Form to Options Menu
    document.querySelector('#btnBackToOptionsMenu').addEventListener('click', () => {
        hideAllScreens()
        divAddInfo.classList.remove("d-none")
        divAddInfo.classList.add("d-flex")
    })
    //This function is AI generated
    //When the user clicks the Submit User Info button, begin the review + save workflow
    document.getElementById("btnSubmitInfo").addEventListener("click", () => {
        //collect all of the user inputs from the submitted form
        const strFirstName = document.getElementById("txtFirstName").value.trim()
        const strLastName = document.getElementById("txtLastName").value.trim()
        const strEmail = document.getElementById("txtEmail").value.trim()
        const strPhone = document.getElementById("txtPhone").value.trim()
        const strAddress = document.getElementById("txtAddress").value.trim()
        
        // Validate required fields are entered
        //if something is missing, send message to user letting them know 
        if (!strFirstName || !strLastName || !strEmail) {
            Swal.fire({
                title: "Missing Info",
                text: "Ensure that firstName, lastName, and email are entered",
                icon: "error"
            })
            return
        }
        //Build the user info object that will be sent to the backend
        const objUserInfo = {
            firstName: strFirstName,
            lastName: strLastName,
            email: strEmail,
            phone: strPhone,
            address: strAddress
        }
        // Show a loading popup while the AI reviews the user's information
        //This has been added so the user knows something is happening when they click the button 
        Swal.fire({
            title: "Reviewing your information...",
            text: "Please wait while AI checks your entry.",
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading() 
            }
        })
        //Send the user info to the AI review function
        fetch("http://localhost:8000/api/users/review", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(objUserInfo)
        })
        .then((objResponse) => {
            //if the server returned an error
            if (!objResponse.ok) {
                return objResponse.json().then((objData) => { // Read the error from the server, then throw a new Error
                    throw new Error(objData.message || objData.error || "Unable to review user info.")
                })
            }//if the response is ok, convert the response from JSON text into a JS object
            return objResponse.json()
        })
        //Display the AI suggestions and allow the user to choose to save or edit their response
        .then((objData) => {
            return Swal.fire({
                title: "Review Suggestions",
                html: `<strong>AI Suggestions:</strong><br><br>${(objData.aiSuggestions || []).join("<br>")}`,
                icon: "info",
                showCancelButton: true,
                confirmButtonText: "Save Anyway",
                cancelButtonText: "Edit"
            })
        })
        //If the user chooses to edit, stop the workflow
        .then((objResult) => {
            if (!objResult.isConfirmed) {
                return null
            }
            //Otherwise, send the data to the backend to be saved
            return fetch("http://localhost:8000/api/users", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(objUserInfo)
            })
        })
        .then((objResponse) => {
            //this detects the case where no request was originally made because the user chose not to save
            if (!objResponse) {
                return null
            }
            //if the response is not ok, call objResponse.json() to read the error from the server
            if (!objResponse.ok) {
                return objResponse.json().then((objData) => { //create a new Error object
                    throw new Error(objData.message || objData.error || "Unable to save user.");
                })
            }
            return objResponse.json() //then read the response body and parses it as JSON
        })
        .then((objData) => {
            //If nothing was saved, exit
            if (!objData) {
                return
            }
            //Show success message after saving the user
            Swal.fire({
                title: "Success",
                text: "User saved successfully.",
                icon: "success"
            })
            //Clear all input fields after successful save
            document.getElementById("txtFirstName").value = ""
            document.getElementById("txtLastName").value = ""
            document.getElementById("txtEmail").value = ""
            document.getElementById("txtPhone").value = ""
            document.getElementById("txtAddress").value = ""

            //Return to the Add Info screen
            hideAllScreens()
            divAddInfo.classList.remove("d-none")
            divAddInfo.classList.add("d-flex")
        })
        .catch((objError) => {
            //Display any errors that occurred 
            Swal.fire({
                title: "Error",
                text: objError.message,
                icon: "error"
            })
        })
    })



    //---------------------------Education section---------------------------
    //Transition from Options Menu to Education Info Form
    document.querySelector('#btnGoToEducation').addEventListener('click', () => {
        hideAllScreens()
        divAddEducationInfoCard.classList.remove("d-none")
        divAddEducationInfoCard.classList.add("d-flex")
    })
    //Back button from Education Info Form to Options Menu
    document.querySelector('#btnBackFromEducation').addEventListener('click', () => {
        hideAllScreens()
        divAddInfo.classList.remove("d-none")
        divAddInfo.classList.add("d-flex")
    })
    //This function is AI generated
    //When the user clicks the Submit education Info button, begin the review + save workflow
    document.getElementById("btnSubmitEducation").addEventListener("click", () => {
        //collect all of the education inputs from the submitted form
        const strSchoolName = document.getElementById("txtSchool").value.trim()
        const strDegree = document.getElementById("txtDegree").value.trim()
        const strMajor = document.getElementById("txtMajor").value.trim()
        const strGradYear = document.getElementById("txtGradYear").value.trim()

        // Validate required fields are entered
        if (!strSchoolName || !strDegree || !strMajor) {
            Swal.fire({
                title: "Missing Info",
                text: "Ensure that school name, degree, and major are entered",
                icon: "error"
            })
            return
        }
        //Build the education info object that will be sent to the backend
        const objEducationInfo = {
            schoolName: strSchoolName,
            degree: strDegree,
            major: strMajor,
            graduationYear: strGradYear
        }      
        //This has been added so the user knows something is happening when they click the button 
        // Show a loading popup while the AI reviews the education information
        Swal.fire({
            title: "Reviewing your information...",
            text: "Please wait while AI checks your entry.",
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading()
            }
        })

        //Send the education info to the AI review function
        fetch("http://localhost:8000/api/education/review", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(objEducationInfo)
        })
        .then((objResponse) => {
            //if the server returned an error
            if (!objResponse.ok) {
                return objResponse.json().then((objData) => { // Read the error from the server, then throw a new Error
                    throw new Error(objData.message || objData.error || "Unable to review education info.")
                })
            }//if the response is ok, convert the response from JSON text into a JS object
            return objResponse.json()
        })

        //Display the AI suggestions and allow the user to choose to save or edit their response
        .then((objData) => {
            return Swal.fire({
                title: "Review Suggestions",
                html: `<strong>AI Suggestions:</strong><br><br>${(objData.aiSuggestions || []).join("<br>")}`,
                icon: "info",
                showCancelButton: true,
                confirmButtonText: "Save Anyway",
                cancelButtonText: "Edit"
            })
        })

        //If the user chooses to edit, stop the workflow
        .then((objResult) => {
            if (!objResult.isConfirmed) {
                return null
            }
            //Otherwise, send the data to the backend to be saved
            return fetch("http://localhost:8000/api/education", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(objEducationInfo)
            })
        })
        .then((objResponse) => {
            //this detects the case where no request was originally made because the user chose not to save
            if (!objResponse) {
                return null
            }
            //if the response is not ok, call objResponse.json() to read the error from the server
            if (!objResponse.ok) {
                return objResponse.json().then((objData) => { //create a new Error object
                    throw new Error(objData.message || objData.error || "Unable to save education.");
                })
            }
            return objResponse.json() //then read the response body and parses it as JSON
        })
        .then((objData) => {
            //If nothing was saved, exit
            if (!objData) {
                return
            }
            //Show success message after saving the education info
            Swal.fire({
                title: "Success",
                text: "Education saved successfully.",
                icon: "success"
            })

            //Clear all input fields after successful save
            document.getElementById("txtSchool").value = ""
            document.getElementById("txtDegree").value = ""
            document.getElementById("txtMajor").value = ""
            document.getElementById("txtGradYear").value = ""

            //Return to the Add Info screen
            hideAllScreens()
            divAddInfo.classList.remove("d-none")
            divAddInfo.classList.add("d-flex")
        })

        .catch((objError) => {
            //Display any errors that occurred 
            Swal.fire({
                title: "Error",
                text: objError.message,
                icon: "error"
            })
        })
    })



    //---------------------------Job section---------------------------
    //Transition from Options Menu to Job Info Form
    document.querySelector('#btnGoToJob').addEventListener('click', () => {
        hideAllScreens()
        divAddJobInfoCard.classList.remove("d-none")
        divAddJobInfoCard.classList.add("d-flex")
    })
    //Back button from job Info Form to Options Menu
     document.querySelector('#btnBackFromJob').addEventListener('click', () => {
        hideAllScreens()
        divAddInfo.classList.remove("d-none")
        divAddInfo.classList.add("d-flex")
    })
    //This function is AI generated
    //When the user clicks the Submit Job Info button, begin the review + save workflow
    document.getElementById("btnSubmitJob").addEventListener("click", () => {
        //collect all of the job inputs from the submitted form
        const strJobTitle = document.getElementById("txtJobTitle").value.trim()
        const strCompany = document.getElementById("txtCompany").value.trim()
       
        // Validate required fields are entered
        if (!strJobTitle || !strCompany) {
            Swal.fire({
                title: "Missing Info",
                text: "Ensure that job title and company are entered",
                icon: "error"
            })
            return
        }

        //Build the job info object that will be sent to the backend
        const objJobInfo = {
            jobTitle: strJobTitle,
            company: strCompany
        }
        //This has been added so the user knows something is happening when they click the button 
        // Show a loading popup while the AI reviews the job information
        Swal.fire({
            title: "Reviewing your information...",
            text: "Please wait while AI checks your entry.",
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading()
            }
        })
        //Send the education info to the AI review function
        fetch("http://localhost:8000/api/jobs/review", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(objJobInfo)
        })
        .then((objResponse) => {
            //if the server returned an error
            if (!objResponse.ok) {
                return objResponse.json().then((objData) => { // Read the error from the server, then throw a new Error
                    throw new Error(objData.message || objData.error || "Unable to review job info.")
                })
            }//if the response is ok, convert the response from JSON text into a JS object
            return objResponse.json()
        })
        //Display the AI suggestions and allow the user to choose to save or edit their response
        .then((objData) => {
            return Swal.fire({
                title: "Review Suggestions",
                html: `<strong>AI Suggestions:</strong><br><br>${(objData.aiSuggestions || []).join("<br>")}`,
                icon: "info",
                showCancelButton: true,
                confirmButtonText: "Save Anyway",
                cancelButtonText: "Edit"
            })
        })
        //If the user chooses to edit, stop the workflow
        .then((objResult) => {
            if (!objResult.isConfirmed) {
                return null
            }
            //Otherwise, send the data to the backend to be saved
            return fetch("http://localhost:8000/api/jobs", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(objJobInfo)
            })
        })
        .then((objResponse) => {
            //this detects the case where no request was originally made because the user chose not to save
            if (!objResponse) {
                return null
            }
            //if the response is not ok, call objResponse.json() to read the error from the server
            if (!objResponse.ok) {
                return objResponse.json().then((objData) => { //create a new Error object
                    throw new Error(objData.message || objData.error || "Unable to save job.");
                })
            }
            return objResponse.json() //then read the response body and parses it as JSON
        })
        .then((objData) => {
            //If nothing was saved, exit
            if (!objData) {
                return
            }
            //Show success message after saving the education info
            Swal.fire({
                title: "Success",
                text: "Job saved successfully.",
                icon: "success"
            })
            //Clear all input fields after successful save
            document.getElementById("txtJobTitle").value = ""
            document.getElementById("txtCompany").value = ""

            //Return to the Add Info screen
            hideAllScreens()
            divAddInfo.classList.remove("d-none")
            divAddInfo.classList.add("d-flex")
        })
        .catch((objError) => {
            //Display any errors that occurred 
            Swal.fire({
                title: "Error",
                text: objError.message,
                icon: "error"
            })
        })
    })


    //---------------------JOB RESPONSIBILITY section -----------------------------------
    //Transition from Options Menu to Education Info Form
    document.querySelector('#btnGoToRes').addEventListener('click', () => {
        hideAllScreens()
        divAddJobResCard.classList.remove("d-none")
        divAddJobResCard.classList.add("d-flex")
        loadJobsIntoDropdown()

    })
    //Back button from job responsibility Info Form to Options Menu
    document.querySelector('#btnBackFromJobRes').addEventListener('click', () => {
        hideAllScreens()
        divAddInfo.classList.remove("d-none")
        divAddInfo.classList.add("d-flex")
    })

    //This function is AI generated
    //When the user clicks the Submit job responsibility button, begin the review + save workflow
    document.getElementById("btnSubmitResponsibility").addEventListener("click", () => {
        //collect all of the job inputs from the submitted form
        const intJobId = parseInt(document.getElementById("selectJobForResp").value)
        const strResponsibility = document.getElementById("txtResponsibility").value.trim()

        // validate that both a job is selected and responsibility text is provided
        if (!intJobId || !strResponsibility) {
            Swal.fire({
                title: "Missing Info",
                text: "Ensure that a job is selected and responsibility is entered",
                icon: "error"
            })
            return
        }

        //build object for backend
        const objResponsibilityInfo = {
            jobId: intJobId,
            responsibility: strResponsibility
        }

        // show a loading screen while the AI review request is being processed
        Swal.fire({
            title: "Reviewing your information...",
            text: "Please wait while AI checks your entry.",
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading()
            }
        })

        // send responsibility data to AI review
        fetch("http://localhost:8000/api/responsibilities/review", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(objResponsibilityInfo)
        })
        // handle AI review response
        .then((objResponse) => {
            if (!objResponse.ok) {
                // convert error response to JSON and throw a readable error
                return objResponse.json().then((objData) => {
                    throw new Error(objData.message || "Unable to review responsibility.")
                })
            }
            return objResponse.json()
        })

        // display AI suggestions to the user for confirmation
        .then((objData) => {
            return Swal.fire({
                title: "Review Suggestions",
                html: `<strong>AI Suggestions:</strong><br><br>${(objData.aiSuggestions || []).join("<br>")}`,
                icon: "info",
                showCancelButton: true,             // allow user to edit instead of saving
                confirmButtonText: "Save Anyway",
                cancelButtonText: "Edit"
            })
        })

        // if user confirms, send the responsibility to the backend for saving
        .then((objResult) => {
            if (!objResult.isConfirmed) {   // user chose to edit instead of saving
                return null
            }

            return fetch("http://localhost:8000/api/responsibilities", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(objResponsibilityInfo)
            })
        })
        // handle save response
        .then((objResponse) => {
            if (!objResponse) return null   // nothing to process if user canceled

            if (!objResponse.ok) {
                // convert backend error to readable message
                return objResponse.json().then((objData) => {
                    throw new Error(objData.message || "Unable to save responsibility.")
                })
            }
            return objResponse.json()   // parse successful save response
        })
        // show success message and reset 
        .then((objData) => {
            if (!objData) return

            Swal.fire({
                title: "Success",
                text: "Responsibility saved successfully.",
                icon: "success"
            })

            //clear form inputs
            document.getElementById("selectJobForResp").value = ""
            document.getElementById("txtResponsibility").value = ""

            //return user to main Add Information screen
            hideAllScreens()
            divAddInfo.classList.remove("d-none")
            divAddInfo.classList.add("d-flex")
        })
        //catch and display any errors from review or save steps
        .catch((objError) => {
            Swal.fire({
                title: "Error",
                text: objError.message,
                icon: "error"
            })
        })
    })


    //------------------------------Skills section--------------------------------------------
    //Transition from Options Menu to skills Info Form
    document.querySelector('#btnGoToSkill').addEventListener('click', () => {
        hideAllScreens()
        divAddSkillsCard.classList.remove("d-none")
        divAddSkillsCard.classList.add("d-flex")
    })
    //Back button from skill Info Form to Options Menu
    document.querySelector('#btnBackFromSkill').addEventListener('click', () => {
        hideAllScreens()
        divAddInfo.classList.remove("d-none")
        divAddInfo.classList.add("d-flex")
    })

    //This function is AI generated
    //When the user clicks the Submit skills button, begin the review + save workflow
    document.getElementById("btnSubmitSkill").addEventListener("click", () => {
        // collect input from the skill text field and trim whitespace
        const strSkillName = document.getElementById("txtSkill").value.trim()
        // validate that the user actually entered a skill
        if (!strSkillName) {
            Swal.fire({
                title: "Missing Info",
                text: "Ensure that a skill is entered",
                icon: "error"
            })
            return  // stop execution if validation fails
        }
        // build object for backend
        const objSkillInfo = {
            skillName: strSkillName
        }   
        // show a loading popup while the AI review request is processed    
        Swal.fire({
            title: "Reviewing your information...",
            text: "Please wait while AI checks your entry.",
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading()
            }
        })

        // send the skill to the AI review 
        fetch("http://localhost:8000/api/skills/review", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(objSkillInfo)
        })
        // handle the AI review response
        .then((objResponse) => {
            if (!objResponse.ok) {
                // parse backend error and throw readable message
                return objResponse.json().then((objData) => {
                    throw new Error(objData.message || objData.error || "Unable to review skill.")
                })
            }
            return objResponse.json()   // parse successful response
        })

        // display AI suggestions to the user
        .then((objData) => {
            return Swal.fire({
                title: "Review Suggestions",
                html: `<strong>AI Suggestions:</strong><br><br>${(objData.aiSuggestions || []).join("<br>")}`,
                icon: "info",
                showCancelButton: true,         // allow user to edit instead of saving
                confirmButtonText: "Save Anyway",
                cancelButtonText: "Edit"
            })
        })

        // if user confirms, send the skill to the backend for saving
        .then((objResult) => {
            if (!objResult.isConfirmed) {
                return null     // user chose to edit instead of saving
            }   

            return fetch("http://localhost:8000/api/skills", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(objSkillInfo)
            })
        })
        // handle save response
        .then((objResponse) => {
            if (!objResponse) return null   // nothing to process if user canceled

            if (!objResponse.ok) {
                // parse backend error and throw readable message
                return objResponse.json().then((objData) => {
                    throw new Error(objData.message || objData.error || "Unable to save skill.")
                })
            }
            return objResponse.json()   // parse successful save response
        })
        // show success message and reset
        .then((objData) => {
            if (!objData) return
            Swal.fire({
                title: "Success",
                text: "Skill saved successfully.",
                icon: "success"
            })

            // clear the skill input field
            document.getElementById("txtSkill").value = ""

            // return to main Add Information screen
            hideAllScreens()
            divAddInfo.classList.remove("d-none")
            divAddInfo.classList.add("d-flex")
        })
        // catch any errors from review or save steps
        .catch((objError) => {
            Swal.fire({
                title: "Error",
                text: objError.message,
                icon: "error"
            })
        })
    })

    //-------------------------------Certification section-----------------------------------------
    //Transition from Options Menu to Certification Info Form
    document.querySelector('#btnGoToCertification').addEventListener('click', () => {
        hideAllScreens()
        divAddCertificateCard.classList.remove("d-none")
        divAddCertificateCard.classList.add("d-flex")
    })
    //Back button from Certification Info Form to Options Menu
    document.querySelector('#btnBackFromCertificate').addEventListener('click', () => {
        hideAllScreens()
        divAddInfo.classList.remove("d-none")
        divAddInfo.classList.add("d-flex")
    })

    //This function is AI generated
    //When the user clicks the Submit certificate button, begin the review + save workflow
    document.getElementById("btnSubmitCertificate").addEventListener("click", () => {

        // collect inputs from the certificate form fields
        const strCertificateName = document.getElementById("txtCertificateName").value.trim()
        const strOrganization = document.getElementById("txtIssuer").value.trim()
        const strIssueDate = document.getElementById("txtIssueDate").value.trim()

        // validate that required fields (certificate name + organization) are provided
        if (!strCertificateName || !strOrganization) {
            Swal.fire({
                title: "Missing Info",
                text: "Ensure that certificate name and organization are entered",
                icon: "error"
            })
            return  // stop execution if validation fails
        }

        // build the object that will be sent to the backend API
        const objCertificateInfo = {
            certificateName: strCertificateName,
            organization: strOrganization,
            issueDate: strIssueDate
        }
        // show a loading popup while the AI review request is processed
        Swal.fire({
            title: "Reviewing your information...",
            text: "Please wait while AI checks your entry.",
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading()
            }
        })

        // send certificate data to the AI review
        fetch("http://localhost:8000/api/certificates/review", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(objCertificateInfo)
        })
        // handle AI review response
        .then((objResponse) => {
            if (!objResponse.ok) {
                // parse backend error and throw readable message
                return objResponse.json().then((objData) => {
                    throw new Error(objData.message || objData.error || "Unable to review certificate.")
                })
            }
            return objResponse.json()   // parse successful response
        })

        // display AI suggestions to the user
        .then((objData) => {
            return Swal.fire({
                title: "Review Suggestions",
                html: `<strong>AI Suggestions:</strong><br><br>${(objData.aiSuggestions || []).join("<br>")}`,
                icon: "info",
                showCancelButton: true,         // allow user to edit instead of saving
                confirmButtonText: "Save Anyway",
                cancelButtonText: "Edit"
            })
        })

        // if user confirms, send the certificate to the backend for saving
        .then((objResult) => {
            if (!objResult.isConfirmed) {
                return null     // user chose to edit instead of saving
            }

            return fetch("http://localhost:8000/api/certificates", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(objCertificateInfo)
            })
        })
        // handle save response
        .then((objResponse) => {
            if (!objResponse) return null   // nothing to process if user canceled

            if (!objResponse.ok) {
                // parse backend error and throw readable message
                return objResponse.json().then((objData) => {
                    throw new Error(objData.message || objData.error || "Unable to save certificate.")
                })
            }

            return objResponse.json()
        })
        // show success message and reset 
        .then((objData) => {
            if (!objData) return    // exit if nothing was saved

            Swal.fire({
                title: "Success",
                text: "Certificate saved successfully.",
                icon: "success"
            })

            // clear all certificate input fields
            document.getElementById("txtCertificateName").value = ""
            document.getElementById("txtIssuer").value = ""
            document.getElementById("txtIssueDate").value = ""

            // return user to main Add Information screen
            hideAllScreens()
            divAddInfo.classList.remove("d-none")
            divAddInfo.classList.add("d-flex")
        })
        // catch and display any errors from review or save steps
        .catch((objError) => {
            Swal.fire({
                title: "Error",
                text: objError.message,
                icon: "error"
            })
        })
    })


    //---------------------------Award section---------------------------------------------
    //Transition from Options Menu to Award Info Form
    document.querySelector('#btnGoToAward').addEventListener('click', () => {
        hideAllScreens()
        divAddAwardCard.classList.remove("d-none")
        divAddAwardCard.classList.add("d-flex")
    })
    //Back button from award Info Form to Options Menu
    document.querySelector('#btnBackFromAward').addEventListener('click', () => {
        hideAllScreens()
        divAddInfo.classList.remove("d-none")
        divAddInfo.classList.add("d-flex")
    })

    //This function is AI generated
    //When the user clicks the Submit award button, begin the review + save workflow
    document.getElementById("btnSubmitAward").addEventListener("click", () => {

        // collect inputs from the award form fields
        const strAwardName = document.getElementById("txtAwardName").value.trim()
        const strOrganization = document.getElementById("txtOrganization").value.trim()
        const strIssueDate = document.getElementById("txtAwardDate").value.trim()

        // validate that required fields (award name + organization) are provided
        if (!strAwardName || !strOrganization) {
            Swal.fire({
                title: "Missing Info",
                text: "Ensure that award name and organization are entered",
                icon: "error"
            })
            return  // stop execution if validation fails
        }

        // build the object that will be sent to the backend API
        const objAwardInfo = {
            awardName: strAwardName,
            organization: strOrganization,
            issueDate: strIssueDate
        }

        // show a loading popup while the AI review request is processed
        Swal.fire({
            title: "Reviewing your information...",
            text: "Please wait while AI checks your entry.",
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading()
            }
        })

        // send award data to the AI review endpoint
        fetch("http://localhost:8000/api/awards/review", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(objAwardInfo)
        })
        // handle AI review response
        .then((objResponse) => {
            if (!objResponse.ok) {
                // parse backend error and throw readable message
                return objResponse.json().then((objData) => {
                    throw new Error(objData.message || objData.error || "Unable to review award.")
                })
            }
            return objResponse.json()
        })

        // display AI suggestions to the user
        .then((objData) => {
            return Swal.fire({
                title: "Review Suggestions",
                html: `<strong>AI Suggestions:</strong><br><br>${(objData.aiSuggestions || []).join("<br>")}`,
                icon: "info",
                showCancelButton: true,
                confirmButtonText: "Save Anyway",
                cancelButtonText: "Edit"
            })
        })

        // if user confirms, send the award to the backend for saving
        .then((objResult) => {
            if (!objResult.isConfirmed) {
                return null     // user chose to edit instead of saving
            }

            return fetch("http://localhost:8000/api/awards", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(objAwardInfo)
            })
        })
        // handle save response
        .then((objResponse) => {
            if (!objResponse) return null   // nothing to process if user canceled

            if (!objResponse.ok) {
                // parse backend error and throw readable message
                return objResponse.json().then((objData) => {
                    throw new Error(objData.message || objData.error || "Unable to save award.")
                })
            }

            return objResponse.json()   // parse successful save response
        })
        // show success message and reset
        .then((objData) => {
            if (!objData) return    // exit if nothing was saved

            Swal.fire({
                title: "Success",
                text: "Award saved successfully.",
                icon: "success"
            })

            // clear all award input fields
            document.getElementById("txtAwardName").value = ""
            document.getElementById("txtOrganization").value = ""
            document.getElementById("txtAwardDate").value = ""

            // return user to main Add Information screen
            hideAllScreens()
            divAddInfo.classList.remove("d-none")
            divAddInfo.classList.add("d-flex")
        })
        // catch and display any errors from review or save steps
        .catch((objError) => {
            Swal.fire({
                title: "Error",
                text: objError.message,
                icon: "error"
            })
        })
    })

    //GENERATE RESUME PORTION

    function loadBuildResumeOptions() {
        Promise.all([
            // send multiple fetch requests in parallel to load all resume‑related data
            fetch("http://localhost:8000/api/users").then(objResponse => objResponse.json()),
            fetch("http://localhost:8000/api/education").then(objResponse => objResponse.json()),
            fetch("http://localhost:8000/api/jobs").then(objResponse => objResponse.json()),
            fetch("http://localhost:8000/api/responsibilities").then(objResponse => objResponse.json()),
            fetch("http://localhost:8000/api/skills").then(objResponse => objResponse.json()),
            fetch("http://localhost:8000/api/certificates").then(objResponse => objResponse.json()),
            fetch("http://localhost:8000/api/awards").then(objResponse => objResponse.json())
        ])
        // once all fetches complete, unpack the returned arrays
        .then(([arrUsers, arrEducation, arrJobs, arrResponsibilities, arrSkills, arrCertificates, arrAwards]) => {
            // populate the user selection section
            renderUserOptions(arrUsers)
            // populate education checkboxes with formatted labels
            renderCheckboxes("divEducationCheckboxes", arrEducation, "education_id", (objItem) =>
                `${objItem.school_name} - ${objItem.degree} (${objItem.major})`
            )
            // populate job checkboxes with job title + company
            renderCheckboxes("divJobCheckboxes", arrJobs, "job_id", (objItem) =>
                `${objItem.job_title} - ${objItem.company_name}`
            )
            // populate responsibility checkboxes with description text
            renderCheckboxes("divResponsibilityCheckboxes", arrResponsibilities, "responsibility_id", (objItem) =>
                `${objItem.description}`
            )
            // populate skill checkboxes with skill name
            renderCheckboxes("divSkillCheckboxes", arrSkills, "skill_id", (objItem) =>
                `${objItem.skill_name}`
            )
            // populate certificate checkboxes with certificate name
            renderCheckboxes("divCertificateCheckboxes", arrCertificates, "certificate_id", (objItem) =>
                `${objItem.certificate_name}`
            )
            // populate award checkboxes with award name
            renderCheckboxes("divAwardCheckboxes", arrAwards, "award_id", (objItem) =>
                `${objItem.award_name}`
            )
        })
        // catch any errors from the fetch operations
        .catch((objError) => {
            Swal.fire({
                title: "Error",
                text: objError.message,
                icon: "error"
            })
        })
    }

    function renderUserOptions(arrUsers) {
        // get the container where the user radio buttons will be rendered
        const divContainer = document.getElementById("divUserOptions")
        // replace container contents with a list of radio buttons for each user
        divContainer.innerHTML = arrUsers.map((objUser) => `
            <div class="form-check text-start mb-2">
                <input class="form-check-input" type="radio" name="selectedUser" value="${objUser.user_id}" id="user_${objUser.user_id}">
                <label class="form-check-label" for="user_${objUser.user_id}">
                    ${objUser.first_name} ${objUser.last_name} - ${objUser.email}
                </label>
            </div>
        `).join("")     // join all generated HTML into a single string
    }

    function renderCheckboxes(strContainerID, arrItems, strKeyName, fnLabelBuilder) {
        // get the container where the checkbox list will be rendered
        const divContainer = document.getElementById(strContainerID)
        // replace container contents with a list of checkboxes generated from arrItems
        divContainer.innerHTML = arrItems.map((objItem) => `
            <div class="form-check text-start mb-2">
                <input class="form-check-input" type="checkbox" value="${objItem[strKeyName]}" id="${strContainerID}_${objItem[strKeyName]}">
                <label class="form-check-label" for="${strContainerID}_${objItem[strKeyName]}">
                    ${fnLabelBuilder(objItem)}
                </label>
            </div>
        `).join("") // join all generated HTML into a single string
    }

    // when the user clicks "Build Resume"
    document.querySelector("#btnAddResume").addEventListener("click", () => {
        hideAllScreens()
        divBuildResume.classList.remove("d-none")
        divBuildResume.classList.add("d-flex")

        loadBuildResumeOptions()    // load all selectable resume options (users, jobs, skills, etc.)
    })

    // when the user clicks the Back button on the Build Resume screen
    document.querySelector("#btnBackFromBuildResume").addEventListener("click", () => {
        hideAllScreens()
        divHome.classList.remove("d-none")
    })

    function getCheckedValues(strSelector) {
        // select all checkbox elements that match the provided selector
        return Array.from(document.querySelectorAll(strSelector))
            .filter((objCheckbox) => objCheckbox.checked)   // keep only the checkboxes that are currently checked
            .map((objCheckbox) => Number(objCheckbox.value))    // convert each checked checkbox's value into a Number
    }
    //AI generated
    //Final button for generating a resume
    document.getElementById("btnGenerateResumeFinal").addEventListener("click", () => {
        // collect the resume name entered by the user
        const strResumeName = document.getElementById("txtResumeName").value.trim()
        const objSelectedUser = document.querySelector('input[name="selectedUser"]:checked')
        // validate that a resume name was entered
        if (!strResumeName) {
            Swal.fire({
                title: "Missing Info",
                text: "Please enter a resume name.",
                icon: "error"
            })
            return  // stop execution if missing
        }
        // validate that a user was selected
        if (!objSelectedUser) {
            Swal.fire({
                title: "Missing Info",
                text: "Please select a user.",
                icon: "error"
            })
            return  // stop execution if missing
        }
        // build the object containing all selected resume components
        const objResumeSelection = {
            resumeName: strResumeName,
            userId: Number(objSelectedUser.value),
            educationIds: getCheckedValues('#divEducationCheckboxes input[type="checkbox"]'),
            jobIds: getCheckedValues('#divJobCheckboxes input[type="checkbox"]'),
            responsibilityIds: getCheckedValues('#divResponsibilityCheckboxes input[type="checkbox"]'),
            skillIds: getCheckedValues('#divSkillCheckboxes input[type="checkbox"]'),
            certificateIds: getCheckedValues('#divCertificateCheckboxes input[type="checkbox"]'),
            awardIds: getCheckedValues('#divAwardCheckboxes input[type="checkbox"]')
        }
        // show loading popup while AI generates the resume
        Swal.fire({
            title: "Generating resume...",
            text: "Please wait while AI builds your resume.",
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading()
            }
        })
        // send resume selection data to backend for AI generation
        fetch("http://localhost:8000/api/resumes/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(objResumeSelection)
        })
        // handle backend response
        .then((objResponse) => {
            if (!objResponse.ok) {
                return objResponse.json().then((objData) => {
                    throw new Error(objData.message || objData.error || "Unable to generate resume.")
                })
            }
            return objResponse.json()   // parse successful response
        })
        // process and display resume preview
        .then((objData) => {
            // helper function to clean AI‑generated HTML into consistent formatting
            function cleanResumeText(str) {
                return str
                    .replace(/<\/?(b|strong)>/gi, "")   // remove bold tags
                    .replace(/<\/?p>/gi, "<br>")        // convert <p> to <br>
                    .replace(/<br\s*\/?>/gi, "<br>")    // normalize <br> tags
                    .replace(/```html/gi, "")           // remove code fences
                    .replace(/```/g, "")
                    .replace(/(<br\s*\/?>\s*){2,}/gi, "<br>")   // collapse multiple breaks
                    .trim();
            }
            // clean the resume text returned by AI
            const strClean = cleanResumeText(objData.resumeText);
            // split into lines for header/body formatting
            const arrLines = strClean.split("<br>");
            // show formatted resume preview in SweetAlert
            return Swal.fire({
                title: "Resume Preview",
                width: 1000,
                customClass: {
                    htmlContainer: 'text-left-container'
                },
                              html: `
                        <div style="font-family: Arial, sans-serif;">

                            <div style="text-align:left; font-size:18px; font-weight:600; margin-bottom:4px;">
                                ${arrLines[0] || ""}
                            </div>

                            <div style="text-align:left; font-size:13px; margin-bottom:12px;">
                                ${arrLines[1] || ""}
                            </div>

                            <div style="text-align:left; font-size:12px; line-height:1.4;">
                                ${arrLines.slice(2).map(line => {
                                    const trimmed = line.trim();

                                    if (trimmed && trimmed === trimmed.toUpperCase()) {
                                        return `<div style="
                                                    font-size:13px;
                                                    font-weight:600;
                                                    margin-top:10px;
                                                    margin-bottom:4px;
                                                ">
                                                    ${trimmed}
                                                </div>`;
                                    }

                                    return `<div style="margin-bottom:2px;">${trimmed}</div>`;
                                }).join("")}
                            </div>

                        </div>
                        `,
                confirmButtonText: "OK"
            })
        })
        // after preview is closed, reset form and return to home screen
        .then(() => {
            clearBuildResumeForm();
            hideAllScreens();
            divHome.classList.remove("d-none");
        })
        // catch and display any errors
        .catch((objError) => {
            Swal.fire({
                title: "Error",
                text: objError.message,
                icon: "error"
            })
        })
    })



    function loadSavedResumes() {
        // request all saved resumes from the backend
        fetch("http://localhost:8000/api/resumes")
        // handle the fetch response    
        .then((objResponse) => {
            // if the response is not OK, extract backend error message    
            if (!objResponse.ok) {
                    return objResponse.json().then((objData) => {
                        throw new Error(objData.message || objData.error || "Unable to load saved resumes.")
                    })
                }
                return objResponse.json()   // parse successful JSON response
            })
            // process the array of saved resumes
            .then((arrResumes) => {
                // get the container where resume buttons will be displayed
                const divSavedResumeList = document.getElementById("divSavedResumeList")
                // if no resumes exist, show a simple message
                if (!arrResumes.length) {
                    divSavedResumeList.innerHTML = `<p class="mb-0">No saved resumes found.</p>`
                    return
                }
                // build a button for each saved resume
                divSavedResumeList.innerHTML = arrResumes.map((objResume) => `
                    <button
                        class="btn w-100 text-black mb-2"
                        type="button"
                        style="background-color: #f7c2d8"
                        data-resumeid="${objResume.resume_id}">
                        ${objResume.resume_name}
                    </button>
                `).join("")
                // attach click handlers to each generated button
                divSavedResumeList.querySelectorAll("[data-resumeid]").forEach((objButton) => {
                    objButton.addEventListener("click", () => {
                        // extract resume ID from the button's dataset
                        const intResumeID = Number(objButton.dataset.resumeid)
                        // open the selected resume in a preview popup
                        openSavedResume(intResumeID)
                    })
                })
            })
            // catch and display any errors from the fetch or processing steps
            .catch((objError) => {
                Swal.fire({
                    title: "Error",
                    text: objError.message,
                    icon: "error"
                })
            })
    }

    function openSavedResume(intResumeID) {
        // request the resume data for the selected resume ID
        fetch(`http://localhost:8000/api/resumes/${intResumeID}`)
            // handle the fetch response    
            .then((objResponse) => {
                // if backend returned an error, extract message and throw it    
                if (!objResponse.ok) {
                        return objResponse.json().then((objData) => {
                            throw new Error(objData.message || objData.error || "Unable to load resume.")
                        })
                    }
                return objResponse.json()       // parse successful JSON response
            })
            // process the returned resume row
            .then((arrRows) => {
                // backend returns an array; extract the first row
                const objResume = arrRows[0]
                // ensure a resume was actually found
                if (!objResume) {
                    throw new Error("Resume not found.")
                }
                // helper function to clean AI‑generated resume text
                function cleanResumeText(str) {
                    return str
                        .replace(/<\/?(b|strong)>/gi, "")
                        .replace(/<\/?p>/gi, "<br>")
                        .replace(/<br\s*\/?>/gi, "<br>")
                        .replace(/```html/gi, "")
                        .replace(/```/g, "")
                        .replace(/(<br\s*\/?>\s*){2,}/gi, "<br>")
                        .trim()
                }
                // clean the resume text
                const strClean = cleanResumeText(objResume.resume_text)
                // split into lines for header/body formatting
                const arrLines = strClean.split("<br>")
                // show formatted resume preview in SweetAlert
                Swal.fire({
                    title: "Resume Preview",
                    width: 1000,

                    customClass: {
                        htmlContainer: 'text-left-container'
                    },

                    html: `
                        <div style="font-family: Arial, sans-serif;">

                            <div style="text-align:left; font-size:18px; font-weight:600; margin-bottom:4px;">
                                ${arrLines[0] || ""}
                            </div>

                            <div style="text-align:left; font-size:13px; margin-bottom:12px;">
                                ${arrLines[1] || ""}
                            </div>

                            <div style="text-align:left; font-size:12px; line-height:1.4;">
                                ${arrLines.slice(2).map(line => {
                                    const trimmed = line.trim();

                                    if (trimmed && trimmed === trimmed.toUpperCase()) {
                                        return `<div style="
                                                    font-size:13px;
                                                    font-weight:600;
                                                    margin-top:10px;
                                                    margin-bottom:4px;
                                                ">
                                                    ${trimmed}
                                                </div>`;
                                    }

                                    return `<div style="margin-bottom:2px;">${trimmed}</div>`;
                                }).join("")}
                            </div>

                        </div>
                        `,
                    // allow user to print
                    showCancelButton: true,
                    confirmButtonText: "OK",
                    cancelButtonText: "Print"
                })
                // if user clicked "Print", open print window
                .then((objResult) => {
                    if (objResult.dismiss === Swal.DismissReason.cancel) {
                        printResumeWindow(objResume.resume_name, objResume.resume_text)
                    }
                })
            })
            // catch and display any errors from fetch or processing
            .catch((objError) => {
                Swal.fire({
                    title: "Error",
                    text: objError.message,
                    icon: "error"
                })
            })
    }

    function printResumeWindow(strResumeName, strResumeText) {
        // open a new browser window for printing the resume
        const objPrintWindow = window.open("", "_blank", "width=900,height=1000")
        // if the popup was blocked, show a warning and stop execution
        if (!objPrintWindow) {
            Swal.fire({
                title: "Popup Blocked",
                text: "Please allow popups to print your saved resume.",
                icon: "warning"
            })
            return
        }
        // clean the AI‑generated resume text by removing unwanted tags and extra breaks
        const strCleanHtml = strResumeText
            .replace(/```html/gi, "")
            .replace(/```/g, "")
            .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, "<br>")
            .replace(/(<br\s*\/?>\s*){2,}/gi, "<br>")
            .trim()
        // open the print window document for writing
        objPrintWindow.document.open()
        // if the resume already contains full HTML, use it directly; otherwise wrap it in a full HTML document
        const strFinalHtml = strCleanHtml.includes("<html") ? strCleanHtml : `
            <!DOCTYPE html>
            <html>
            <head>
            <meta charset="UTF-8">
            <title>${strResumeName}</title>
            </head>

            <body style="margin: 0.5in 0.75in; font-family: Arial, sans-serif;">

                <div style="text-align: center; font-size: 18px; font-weight: bold;">
                    ${strCleanHtml.split("<br>")[0]}
                </div>

                <div style="text-align: center; margin-bottom: 13px;">
                    ${strCleanHtml.split("<br>")[1] || ""}
                </div>

                <div style="font-size: 14px; line-height: 1.3;">
                    ${
                        strCleanHtml
                            .split("<br>")
                            .slice(2)
                            .join("<br>")
                    }
                </div>

            </body>
            </html>
            `
        // write the final HTML into the print window
        objPrintWindow.document.write(strFinalHtml)
        // close the document so the browser can render it
        objPrintWindow.document.close()
        // once the window finishes loading, focus it and trigger the print dialog
        objPrintWindow.onload = () => {
            objPrintWindow.focus()
            objPrintWindow.print()
        }
    }


    // when the user clicks "View Saved Resumes"
    document.querySelector("#btnViewResumes").addEventListener("click", () => {
        // hide all other screens in the interface
        hideAllScreens()
        divSavedResumes.classList.remove("d-none")
        divSavedResumes.classList.add("d-flex")
        // load all saved resumes from the backend and render them
        loadSavedResumes()
    })
    // when the user clicks the Back button on the Saved Resumes screen
    document.querySelector("#btnBackFromSavedResumes").addEventListener("click", () => {
        // hide all screens
        hideAllScreens()
        // show the home screen
        divHome.classList.remove("d-none")
    })

    function clearBuildResumeForm() {
        // clear the resume name input field
        document.getElementById("txtResumeName").value = ""
        // uncheck all user radio buttons
        document.querySelectorAll('input[name="selectedUser"]').forEach((objRadio) => {
            objRadio.checked = false
        })
        // uncheck all education checkboxes
        document.querySelectorAll('#divEducationCheckboxes input[type="checkbox"]').forEach((objCheckbox) => {
            objCheckbox.checked = false
        })
        // uncheck all job checkboxes
        document.querySelectorAll('#divJobCheckboxes input[type="checkbox"]').forEach((objCheckbox) => {
            objCheckbox.checked = false
        })
        // uncheck all responsibility checkboxes
        document.querySelectorAll('#divResponsibilityCheckboxes input[type="checkbox"]').forEach((objCheckbox) => {
            objCheckbox.checked = false
        })
        // uncheck all skill checkboxes
        document.querySelectorAll('#divSkillCheckboxes input[type="checkbox"]').forEach((objCheckbox) => {
            objCheckbox.checked = false
        })
        // uncheck all certificate checkboxes
        document.querySelectorAll('#divCertificateCheckboxes input[type="checkbox"]').forEach((objCheckbox) => {
            objCheckbox.checked = false
        })
        // uncheck all award checkboxes
        document.querySelectorAll('#divAwardCheckboxes input[type="checkbox"]').forEach((objCheckbox) => {
            objCheckbox.checked = false
        })
    }


    function loadJobsIntoDropdown() {
        // request all jobs from the backend API
        fetch("http://localhost:8000/api/jobs")
        // parse the JSON response    
        .then((res) => res.json())
        // process the returned job list    
        .then((jobs) => {
            // get the job dropdown element   
            const select = document.getElementById("selectJobForResp")
            // clear any existing options and add a default placeholder option
            select.innerHTML = '<option value="">Select a job</option>'
            // loop through each job returned from the backend
            jobs.forEach((job) => {
                // create a new <option> element for the dropdown
                const option = document.createElement("option")
                // set the option value to the job's primary key (job_id)
                option.value = job.job_id   // NOT job.id
                // set the visible text for the option
                option.textContent = `${job.job_title} - ${job.company_name}`
                // add the option to the dropdown
                select.appendChild(option)
                })
            })
            // catch and log any errors from the fetch request
            .catch((err) => {
                console.error("Error loading jobs:", err)
            })
    }
    document.querySelector("#btnSettings").addEventListener("click", () => {
        // open the Settings modal using SweetAlert
        Swal.fire({
            title: "Settings",
            // render two buttons inside the modal: API Key + Thank Bootstrap
            html: `
                <div class="d-grid gap-3">
                    <button id="btnOpenApiKey" class="btn btn-light text-dark">Add Personal API Key</button>
                    <button id="btnThankBootstrap" class="btn btn-light text-dark">Thank Bootstrap</button>
                </div>
            `,
            showConfirmButton: false,
            showCloseButton: true,
            // attach event listeners once the modal is fully rendered
            didOpen: () => {
                // handle "Add Personal API Key" button click
                document.querySelector("#btnOpenApiKey").addEventListener("click", () => {
                    // open a second modal prompting the user for their API key
                    Swal.fire({
                        title: "Enter API Key",
                        input: "text",
                        inputLabel: "Gemini API Key",
                        inputPlaceholder: "Paste your API key here",
                        showCancelButton: true,
                        confirmButtonText: "Save",
                        // validate and save the API key before closing
                        preConfirm: (strApiKey) => {
                            // ensure the user entered something
                            if (!strApiKey || !strApiKey.trim()) {
                                Swal.showValidationMessage("Please enter an API key.")
                                return false
                            }
                            // store the API key in localStorage for later use
                            localStorage.setItem("geminiApiKey", strApiKey.trim())
                            return strApiKey.trim()
                        }
                    })
                    // after the API key modal closes
                    .then((objResult) => {
                        // if the user confirmed, show a success message
                        if (objResult.isConfirmed) {
                            Swal.fire({
                                title: "Saved",
                                text: "Your API key was saved in this browser.",
                                icon: "success"
                            })
                        }
                    })
                })
                // handle "Thank Bootstrap" button click
                document.querySelector("#btnThankBootstrap").addEventListener("click", () => {
                    // show a simple appreciation message
                    Swal.fire({
                        title: "Thank You!",
                        text: "Special thanks to Bootstrap (Materia theme) and SweetAlert for providing the tools to build and style this application.",
                    })
                })
            }
        })
    })
})