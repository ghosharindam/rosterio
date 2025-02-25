

0. First time: Enable the Apps Script API by visiting https://script.google.com/home/usersettings then retry. 

1. You'll need to set up clasp (Command Line Apps Script Projects). Here's how:

```
nvm use node20

npm install @google/clasp

clasp login
```

2. Create a new Google Sheet in your Google Drive. Then, create a new Apps Script project:

```
clasp create --type sheets --title "Rosterio"
```

3. You'll need to create a .claspignore file to specify which files not to upload:

```
# Ignore these files when pushing to Apps Script
**/**
!*.gs
!appsscript.json
```


4. Create an appsscript.json file to define the script properties:

```
{
  "timeZone": "Asia/Kolkata",
  "dependencies": {
  },
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "sheets": {
    "macros": []
  }
}
```

5. Create the App script:

* Open the Google Sheet and go to "Extensions" → "Apps Script"
* Copy the Script ID from the URL of the Apps Script editor. The URL will look like:
https://script.google.com/home/projects/YOUR_SCRIPT_ID/edit


6. Add the Script ID to the .clasp.json

```
{
  "scriptId": "YOUR_SCRIPT_ID",
  "rootDir": "."
}
```


7. Push your code to Apps Script:

```
clasp push
```

8. Deploy the Apps Script as a Web App:

```
clasp deploy --title "Rosterio"
```
