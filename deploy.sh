#gcloud functions deploy login --trigger-http --runtime nodejs10 --memory 128 --timeout 5s --project ft-overlay
#gcloud functions deploy callback --trigger-http --runtime nodejs10 --memory 128 --timeout 5s --project ft-overlay
#gcloud functions deploy requestAccessToken --trigger-http --runtime nodejs10 --memory 128 --timeout 5s --project ft-overlay

# functions deploy requestAccessToken --trigger-http 
functions deploy login --trigger-http 
functions deploy callback --trigger-http 
functions deploy requestAccessToken --trigger-http 