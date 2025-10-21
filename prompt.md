i have init a fresh nextjs project, this project will be Surgery room display 
  - it keeps track of the queue of surgeries ongoing and thier status/scehecdle
  - there's 2 pages admin, viewer
  - admin page will have access to update/add/edit the data
  - viewer page will only display surgeries data to users 
  - we gonna use RTDB from firebase to live display the data across the clients
  - viewer page is gonna use firebase view keys 
  - admin page will use firebase write keys
  - there's a page currently implemented @surgery-room-display.tsx with the style we are looking for and basic data enrty/display
  - make sure to refactor the page to be nextjs comapratibile and put it in the correct dir


  i explanied before that Admin page have write access while viewer has public keys
  the service keys never leave the backend ! and it's used in server side to write the /admin page edits
  