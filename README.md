# grab-zuora-settings
This is a really simple script which automates the pulling of Zuora settings through their publicly available API. 

## How It Works
The following steps are executed:
1.) Retrieve OAuth token from Zuora using Client ID && Client Secret for API Authentication
2.) Retrieve Setting Schema from Zuora.
3.) Scan settings schema for all GET requests that require no parameters
4.) Execute each get request found, push each result set to settingsReport (if errored, push to error report)
5.) Creating Settings Report && Error Report using data from step 4. 

