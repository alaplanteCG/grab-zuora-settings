# Grab Zuora Settings
This is a really simple one file script which automates the pulling of Zuora settings through their publicly available API. It then uses the data retrieved to output report files for easy consumption. 

## How It Works
The following steps are executed:

1.) Retrieve OAuth token from Zuora using Client ID && Client Secret for API Authentication

2.) Retrieve Setting Schema from Zuora.

3.) Scan settings schema for all GET requests that require no parameters

4.) Execute each get request found, push each result set to settingsReport (if errored, push to error report)

5.) Creating Settings Report && Error Report using data from step 4. 

## Configuration
To succesfully run, the following steps need to be followed:

1.) Under config directory, create "default.json"

2.) Copy example.json contents into default.json

3.) Update all values in default.json with values specific to your tenant (if you don't know how to generate a Zuora ID / Secret pair, please google it)

## Output
Once it's ran sucessfully to completion, two reports should have been created in the `./reports` directory.

**1.) Zuora_Settings_Report.json**

This report contains all settings values successfully grabbed as well as the API path used to grab them.

**2.) Zuora_Error_Messages_Report.json**

This report contains all error messages from setting values unsuccesfully grabbed as well as the API path used to grab them. 

