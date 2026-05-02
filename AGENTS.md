## Coding Conventions
  -  **Hungarian Notation**: Use Hungarian notation for variable naming
  - `**camelCase**: Use camelCase when naming all variables 
  -  **Async Javascript**: Perfer to use async await rather than when perfromaing asynchronous javascript functions
  -  **No Build Tools**: Aviod build tools such as Babel, Webpack, or Vite unless it is explicitly required. Code must run either directly in the browser or via nodeJS
  -  **Dependencies**: Do not add external libraries such as jQuery without approval. Perfer native web APIs
  -  **ECMAScript Version**: Target ES6+ features including arrow functions and template literals as well as promises
  _  **External Libraries Local**: All external libraries that are included must not use a CDN but rather be included in project source files 
  - **Bootstrap Utility Classes**: Use only standard Bootstrap 5+ utility classes for layout, spacings, and colors. Aviod creating custom CSS classes or inline styles unless the design cannot be acheived without them

## Accessibility
  -  **Standards**: All user interfaces must meet WCAG 2.1+ accessibility standards
  -  **Alt tags**: All images must also have an alt tag attribute that describes the image
  -  **Priority**: Prioritize accessibility over design
  -  **ARIA Labels**: Include aria labels on all HTML form controls 

## Project Strcture
  -  **Entry Point**: All nodeJS applications must use server.js for entry point
  -  **API Routes**: All API routes must be included in the /api/ routing
  
## API Requiremnts
  -  **RESTful**: All API routes should be RESTful in design
  -  **SELECT**: All user inputs for SELECT should be passed by URL query strings 
  -  **Input Validation**: All user-passed inputs should be validated 
  -  **SELECT RETURN**: All SELECT should return JSON arrarys 
  -  **STATUS Codes**: Every route should return appropriate GTTP status codes do both succuss and error

## DO NOT
  - Do not harcode credentials 
  - Do not intermix user inputs in queries, require prepared statements 
  - Do not skip input validation 
  
## Decision Guidelines 
  - Perfer simpler, less complex and maintainable code 
  - Ask for clarification if uncertain

## Testing 
  - Ensure all GET API routes return JSON arrays 
  - Handle any missing input data with proper error messaging 
  - POST and PUT routes should validare all required fields 