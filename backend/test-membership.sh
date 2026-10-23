API=http://localhost:5055
J='Content-Type: application/json'
login() { curl -s -X POST $API/api/auth/login -H "$J" -d "{\"email\":\"$1\",\"password\":\"$2\"}" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])"; }

PRES=$(login 2103030@student.ruet.ac.bd 11223344)      # president of the approved club
STU=$(login 2203001@student.ruet.ac.bd 11223344)         # second student
DSW=$(login dsw@admin.ruet.ac.bd ruet@12345)
CLUB=93                                                    # id of your approved club

# 1. President sets a 200 BDT fee and a bKash number
curl -s -X PATCH $API/api/clubs/$CLUB/membership-settings -H "$J" -H "Authorization: Bearer $PRES" \
  -d '{"membership_fee":200,"bkash_number":"01712345678"}'

# 2. Student loads the apply-form info (expect my_status "none")
curl -s $API/api/clubs/$CLUB/membership-info -H "Authorization: Bearer $STU"

# 3. Student applies with a bKash transaction ID, and keeps the application id
APP=$(curl -s -X POST $API/api/clubs/$CLUB/applications -H "$J" -H "Authorization: Bearer $STU" \
  -d '{"motivation":"I love photography","payment_method":"bkash","transaction_id":"8n7a6d5ee1"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['application']['id'])")
echo "application id: $APP"

# 4. Applying again must fail with 409
curl -s -X POST $API/api/clubs/$CLUB/applications -H "$J" -H "Authorization: Bearer $STU" \
  -d '{"motivation":"again","payment_method":"cash"}'

# 5. Student tracks it (status pending, payment pending)
curl -s $API/api/applications/mine -H "Authorization: Bearer $STU"

# 6. President sees the queue; a student and the DSW must both get 403
curl -s $API/api/clubs/$CLUB/applications -H "Authorization: Bearer $PRES"
curl -s -o /dev/null -w "student on leader queue: %{http_code}\n" $API/api/clubs/$CLUB/applications -H "Authorization: Bearer $STU"
curl -s -o /dev/null -w "DSW on leader queue:     %{http_code}\n" $API/api/clubs/$CLUB/applications -H "Authorization: Bearer $DSW"

# 7. Approve without confirming the payment -> 400, then with confirmation -> 200
curl -s -X POST $API/api/clubs/$CLUB/applications/$APP/approve -H "$J" -H "Authorization: Bearer $PRES" -d '{}'
curl -s -X POST $API/api/clubs/$CLUB/applications/$APP/approve -H "$J" -H "Authorization: Bearer $PRES" -d '{"payment_verified":true}'

# 8. The old instant-join endpoint is closed (expect 410)
curl -s -o /dev/null -w "instant join: %{http_code}\n" -X POST $API/api/clubs/$CLUB/join -H "Authorization: Bearer $STU"
