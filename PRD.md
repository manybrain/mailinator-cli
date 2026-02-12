* Background

Mailinator is a disposable, receive-only email system.  All email addresses @mailinator.com are public and already exist (up to 50 characters).  There is no concept of “creating” an email address at Mailinator, simply choose one and send email to <your_choice>@mailinator.com

If a user has an API token, they may specify their private domains and use those. Again, they may then use any email address @their_private_domain.com.

Currently, Emails may be retrieved via the website or the API.  

* LLM Prompt for CLI Scaffolding

Role: You are a Senior Node.js Developer.
Task: Build a CLI tool foundation in Node.js that supports execution via npx and global installation.  The tool will be called mailinator-cli
Requirements:
Project Structure: Create a standard Node.js project structure with a src/ directory and a bin/ entry point.
Package Configuration: * Configure package.json with the "bin" field to map the command name to the entry script.
Set the project type to "module" (ESM).
The Entry Point: Create a bin/index.js file. It must include the shebang line (#!/usr/bin/env node) to ensure it executes correctly across different environments.
CLI Framework: Use the commander or yargs library to handle command-line arguments and subcommands.
Task Logic: Provide a placeholder function where I can later inject my specific <task> logic.
Instructions for Use: Include a README.md that explains:
How to link the package locally for development using npm link.
How users can run it via npx <package-name>.
How users can install it globally via npm install -g <package-name>.
Output: Provide the code for package.json, the main entry script, and the directory layout.

Why these specific instructions matter
The Shebang (#!): Without #!/usr/bin/env node at the very top of your entry file, Unix-based systems (and npx) won't know they need to use the Node.js engine to run your script. It’ll just look like a broken text file to them.
The "bin" Field: This is the magic bridge in your package.json. It tells npm: "When someone types 'my-cool-tool', run the file located at './bin/index.js'."
ESM ("type": "module"): This allows you to use modern import/export syntax instead of the older require(), making your tool more future-proof and compatible with modern libraries.
How to test it during development
Once you have your code, you don't need to publish it to the internet to see if it works. Use these commands in your terminal:
npm link: This "fakes" a global installation on your machine. You can then type your command name directly to test the behavior.
npx .: If you are inside your project folder, you can run npx . <args> to simulate how a user would experience the npx flow.

* Functionality

Optionally, a user may provide an API token to the program.  Many CLI programs allow for API tokens specified in settings.json files or other methods.  Allow for specifying the API token in all standardized ways.

If no API token is provided, all API calls below are restricted to the “public” domain.  If an API token is provided, then the default domain becomes "private".  With an API Token, a user may also specify a domain private to their account (e.g., xyz.com) which will be verified by the backend.

The program should support the following commands:

1) mailinator-cli inbox <inbox_name> <domain>

The inbox_name is a required parameter that may be up to 50 characters long and must be alphanumeric. Dots are allowed as long as they are not on the ends.  
The response of the program should be in a well-formatted listing easy to read for humans. The resulting entries should be numbered. 

In the Private domain only (implying only if an API token is given), the inbox may be a single asterisk, or a prefix followed by an asterisk (e.g., joe* )

The domain parameter is optional.  If can be “public”, “private”, or a specific domain (e.g. “xyz.com”) . If it is specified, use it in the api call as described below (validate it follows the options).  If it is not specified, the program should default to “public” if no API token has been provided, and default to “private” if an API token has been provided.

The underlying API call to retrieve an inbox is:

https://api.mailinator.com/cli/v3/domains/<domain>/inboxes/<inbox_name>

The response is in json. Here is a representative example:


{"msgs":[{"fromfull":"news@mail.womanizer.com","subject":"Psst! Just a few days left of SALE...","ip":"156.70.120.240","from":"WOMANIZER","origfrom":"WOMANIZER <news@mail.womanizer.com>","to":"bill","id":"bill-1770915725-013834118013","time":1770915725000,"seconds_ago":1238},{"fromfull":"noreply@growmailer.com","subject":"Traeger Disco Tots & more!","ip":"54.240.9.32","from":"Nicole","origfrom":"Nicole <noreply@growmailer.com>","to":"bill","id":"bill-1770915939-0125389591012","time":1770915939000,"seconds_ago":1024},{"fromfull":"zach@flexibledietinglifestyle.com","subject":"i stay lean because I do this","ip":"167.89.80.39","from":"Zach Rocheleau","origfrom":"Zach Rocheleau <zach@flexibledietinglifestyle.com>","to":"bill","id":"bill-1770916894-013850451013","time":1770916894000,"seconds_ago":69}],"domain":"public","to":"bill"}

As mentioned earlier, this should be presented to the user in the terminal in a nicely-formatted table with numbering.



2) mailinator-cli email <message_id | listing_number> <format>

The first parameter is required and can be a message_id (found in the above json as the “id” field), or the number of the email listing from the last inbox execution.

The 2nd parameter is optional and defaults to “text”.  The possible options for the format parameter are:
        summary - a few quick fields like id, to, from, domain, time, subject
        text - best effort to extract just the text of the message from any message part
        textplain - the exact text/plain body part - if not present, empty string
        texthtml - the exact text/html body part - if not present - 
        full - the entire email in json format. Note this can be very large
        raw - a json object with a "raw" key and the value of the raw email data unparsed.  This can be large
        headers - the smtp headers
        smtplog - the smtp transaction log for the email
        links - the parsed links from the email
        linksfull - the parsed links from the email, each in a JSON object along with the "click text" that should be shown in the html

The representative JSON responses for each format are as follows:


--summary:

{
  "summary": {
    "subject": "Understanding the Emotions Behind Financial Decisions",
    "domain": "public",
    "from": "tswa@lpl.com",
    "id": "bill-1770917680-013860525013",
    "to": "bill",
    "time": 1770917680000
  }
}


--text:

{
  "text": "Email Campaign Hi Ra,      We know that February can often bring a heightened awareness of financial pressure. The holiday season has passed, tax season is in full swing, and year-end spending is reflected in credit card statements. If you’re feeling a bit concerned, 
… some text elided …
ou are hereby advised that any dissemination, distribution or copying of this message is strictly prohibited. &nbsp;If you have received this message in error, please immediately delete. This informational email is an advertisement and you may opt out of receiving future emails. To opt out, please click the \"Unsubscribe\" link below.  This message was sent by Trade Street Wealth Advisors(864) 879-0337304 North Main StreetGreer, SC 29650 Unsubscribe"
}

--textplain:

{
  "text/plain": ""
}


--texthtml:


{
  "text/html": "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Strict//EN\" \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd\"><html xmlns=\"http://www.w3.org/1999/xhtml\"><head><title>Email Campaign</title><meta http-equiv=\"Content-Type\" contenttext/html; charset=utf-8\" /><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" /><style type=\"text/css\">\r\n\t\t\t\t\t.emailTemplate a {                  outline: none;                  color: #209bb9;                  text-decoration: none;              }              a.CustomButtonColor {                  color:                      #FCE09A !important;\r\n\t\t\t\t\t\t background-color: #101A23 !important;\r\n\t\t\t\t\t\t              }              a[x-apple-data-dete\ctors] {                  color: inherit !important;                  text-decoration: none !important;              }              .active {                  -webkit-transition: all 0.3s ease;                  -moz-transition: all 0.3s ease;         \"font: 17px/17px Arial, Helvetica, sans-serif; padding:15px 30px 15px; text-align:left; line-height:1.4;\">Hi Ra,</td>\r\n</tr><tr>\r\n    <td style=\"text-align:center; padding:15px 30px 30px;\">\r\n            <img src=\"https://static.fmgsuite.com/.. some text elideduW9vu5aw_G8r1s14LLJTpQvDif55n1YsE85xXbVo7j3h38CQAA__8iU6ZT\"> Unsubscribe\r\n\t\t\t\t\t\t\t\t\t\t\t\t\t</a></td></tr></table></td></tr></table></td></tr></table><img width=\"1\" height=\"1\" alt=\"\" src=\"https://email.fmgsuite.lpl.com/o/eJxM0L3KFDEU\xvGr2TRDlnzNSU6RQmzcQgsVrE-Sk3kD80UmLnj3sguC7R9-8PBk2k5qy_4oUXtvABWIf-0rXxct_Ci8j1Yb91hnTCZYlICOpQuYZWJiSVCdJZ6BQxX52Afl8R-zZKwqQNKUlCUHrSXa5GXQPjOXAHZOokRAJNKCX0sUag8eRW39Gt9o4_ilTd_pZj6L2o_tXX52Kjz9GJ15TL-Y1vExfSrPdh39Eh-RwBU9G680pAqIYAFT1lklg97OQbR\olAFltNHeOot31JVKSVDVHDRof3Oqbsv1uw2-r-d6z8cmTurjz-stZwKKsx9Lp-1RorGix9TW9ebURm1tO42jv8kzmr8BAAD__2FNbvI\"></body></html>\r\n"
}

-full:

{
    "fromfull": "yourmarriotwelcome@phantomluck.com",
    "headers": {
        "date": "Thu, 12 Feb 2026 12:41:50 -0500",
        "mime-version": "1.0",
        "list-unsubscribe": "<https://unsubscribe.phantomluck.com/yflvnlpl/?e=megauploadsucksnow@maildig.com>",
        "subject": "Here's a thank-you for your recent visit",
        "message-id": "<rb2wuxl.raahiummgrltw.124095@phantomluck.com>",
        "list-unsubscribe-post": "List-Unsubscribe=One-Click",
        "received": "from post.phantomluck.com([45.93.23.79])\r\n        by mail.mailinator.com with SMTP (Mailinator)\r\n        for megauploadsucksnow@maildig.com;\r\n        Thu, 12 Feb 2026 17:42:28 +0000 (UTC)",
        "from": "Your Marriot Welcome <yourmarriotwelcome@phantomluck.com>",
        "content-type": "multipart/alternative; boundary=\"----=_SegmentBoundary_auikthxrpwogyiwhupgjfuez-3346744\"",
        "to": "megauploadsucksnow@maildig.com",
        "reply-to": "yourmarriotwelcome@phantomluck.com",
        "dkim-signature": "v=1; a=rsa-sha256; c=relaxed/relaxed; s=mta1mquoanu8b; d=phantomluck.com;\r\n h=From:Reply-To:List-Unsubscribe:Message-ID:Date:Subject:To:MIME-Version:\r\n Content-Type; i=yourmarriotwelcome@phantomluck.com;\r\n bh=m1Mo8dsRkqBgqoXTNK098UEZw9H6JH4Aiz7efaE9ciU=;\r\n b=W7CAwY9tN8bP5jQBwHQl44qIU69PWsXK3c5IzG+elU9Lx35Fex50VGiCQcMWIlCTKHoVjRwWOZyy\r\n   W7zi5c8aL2IfHaKMidKPdSfxUNv+JHdZtnlJK/ynh0H6r/vN+7W8J6z2zmZozo0TQv6DOx3ktq38\r\n   MB6F22s+xWyK4B3Y5IiPy/gZflkPCBeDLe/JdLf3hAYnLvC3C7raZfxkoCw460UmTl9zKoDUl8S5\r\n   ugwWGYcMyNoB1PQCKyNa4uE6vM7ZbCtw+H3FrDzsmyauLLTOOH5daJx+Fku+/QKo/9m0W9Qcn0Lk\r\n   l61UAeAkietwAncntD9lgy5KLRl969h4P7fv0g=="
    },
    "subject": "Here's a thank-you for your recent visit",
    "ip": "45.93.23.79",
    "seconds_ago": 2323,
    "ttl": 1773510149715,
    "parts": [
        {
            "headers": {
                "content-type": "text/plain; charset=\"UTF-8\""
            },
            "body": "I was considering the project timeline we discussed. We need to align the deliverables with the client's expectations. The initial draft should be ready by Wednesday. Let's schedule a brief call to go over the details. I'll share the document via the shared drive. Please review the sections on implementation. Your feedback on the workflow diagrams would be helpful. We might need to adjust the resource allocation. The team meeting is set for Friday morning. I'll send out an age
.. some text elided ..
I'll draft the outline and share it by Tuesday. We should include the latest data from the quarterly report. Also, check the venue logistics for audio-visual setup. I'll reach out to the organizers about the schedule. It might be useful to have a rehearsal session. Please bring your laptop for the demo. We can discuss the key points during our team check-in.\r\n"
        },
        {
            "headers": {
                "content-type": "text/html; charset=\"UTF-8\""
            },
            "body": "<!DOCTYPE html>\r\n<html lang=\"en\">\r\n<head>\r\n<meta charset=\"UTF-8\">\r\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\r\n</head>\r\n<body style=\"margin:0; padding:0; background-color:#f5f5f5; font-family:Arial, Helvetica, sans-serif;\">\r\n<div style=\"display:none;font-size:1px;color:#ffffff;line-height:1px;font-family:Arial;max-height:0px;max-width:0px;opacity:0;overflow:hidden;mso-hide:all;\">\r\nI was considering the project timeline we
.. some text elided ..
quarterly report. Also, check the venue logistics for audio-visual setup. I'll reach out to the organizers about the schedule. It might be useful to have a rehearsal session. Please bring your laptop for the demo. We can discuss the key points during our team check-in.\r\n</div>\r\n</body>\r\n</html>\r\n"
        }
    ],
    "from": "Your Marriot Welcome",
    "origfrom": "Your Marriot Welcome <yourmarriotwelcome@phantomluck.com>",
    "to": "megauploadsucksnow",
    "id": "megauploadsucksnow-1770918149-0971687107",
    "time": 1770918149000,
    "clickablelinks": [
        {
            "link": "http://www.phantomluck.com/origin/release/seemoretoday/generalline/ab44e096089cff337c38d8383b562867987/focus-center",
            "text": "Access Pillow Set and Stay Details"
        }
    ]
}




-raw:


{ "raw" : "Received: from post.phantomluck.com([45.93.23.79])
        by mail.mailinator.com with SMTP (Mailinator)
        for megauploadsucksnow@maildig.com;
        Thu, 12 Feb 2026 17:42:28 +0000 (UTC)
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; s=mta1mquoanu8b; d=phantomluck.com;
 h=From:Reply-To:List-Unsubscribe:Message-ID:Date:Subject:To:MIME-Version:
 Content-Type; i=yourmarriotwelcome@phantomluck.com;
 bh=m1Mo8dsRkqBgqoXTNK098UEZw9H6JH4Aiz7efaE9ciU=;
 b=W7CAwY9tN8bP5jQBwHQl44qIU69PWsXK3c5IzG+elU9Lx35Fex50VGiCQcMWIlCTKHoVjRwWOZyy
   W7zi5c8aL2IfHaKMidKPdSfxUNv+JHdZtnlJK/ynh0H6r/vN+7W8J6z2zmZozo0TQv6DOx3ktq38
   MB6F22s+xWyK4B3Y5IiPy/gZflkPCBeDLe/JdLf3hAYnLvC3C7raZfxkoCw460UmTl9zKoDUl8S5
   ugwWGYcMyNoB1PQCKyNa4uE6vM7ZbCtw+H3FrDzsmyauLLTOOH5daJx+Fku+/QKo/9m0W9Qcn0Lk
   l61UAeAkietwAncntD9lgy5KLRl969h4P7fv0g==
From: Your Marriot Welcome <yourmarriotwelcome@phantomluck.com>
Reply-To: yourmarriotwelcome@phantomluck.com
List-Unsubscribe: <https://unsubscribe.phantomluck.com/yflvnlpl/?e=megauploadsucksnow@maildig.com>
Message-ID: <rb2wuxl.raahiummgrltw.124095@phantomluck.com>
Date: Thu, 12 Feb 2026 12:41:50 -0500
List-Unsubscribe-Post: List-Unsubscribe=One-Click
Subject: Here's a thank-you for your recent visit
To: megauploadsucksnow@maildig.com
MIME-Version: 1.0
Content-Type: multipart/alternative; boundary="----=_SegmentBoundary_auikthxrpwogyiwhupgjfuez-3346744"

------=_SegmentBoundary_auikthxrpwogyiwhupgjfuez-3346744
Content-Type: text/plain; charset="UTF-8"

I was considering the project timeline we discussed. We need to align the deliverables with the client's expectations. The initial draft should be ready by Wednesday. Let's schedule a brief call to go over the details. I'll share the document via the shared drive. Please review the sections on implementation. Your feedback on the workflow diagrams would be helpful. We might need to adjust the resource allocation. The team meeting is set for Friday morning. I'll send out an agenda beforehand. Also, check the software updates for compatibility. It's important to test the new features. We can discuss this further when you have a moment.

Marriot
Regarding the conference next month, I've booked the travel arrangements. The flights are confirmed for the morning departure. Let's coordinate on the presentation materials. I'll draft the outline and share it by Tuesday. We should include the latest data from the quarterly report. Also, check the venue logistics for audio-visual setup. I'll reach out to the organizers about the schedule. It might be useful to have a rehearsal session. Please bring your laptop for the demo. We can discuss the key points during our team check-in.

------=_SegmentBoundary_auikthxrpwogyiwhupgjfuez-3346744
Content-Type: text/html; charset="UTF-8"

<!DOCTYPE html>
</div>
</body>
</html>

------=_SegmentBoundary_auikthxrpwogyiwhupgjfuez-3346744--" }



--headers:

    {"headers": {
        "date": "Thu, 12 Feb 2026 12:41:50 -0500",
        "mime-version": "1.0",
        "list-unsubscribe": "<https://unsubscribe.phantomluck.com/yflvnlpl/?e=megauploadsucksnow@maildig.com>",
        "subject": "Here's a thank-you for your recent visit",
        "message-id": "<rb2wuxl.raahiummgrltw.124095@phantomluck.com>",
        "list-unsubscribe-post": "List-Unsubscribe=One-Click",
        "received": "from post.phantomluck.com([45.93.23.79])\r\n        by mail.mailinator.com with SMTP (Mailinator)\r\n        for megauploadsucksnow@maildig.com;\r\n        Thu, 12 Feb 2026 17:42:28 +0000 (UTC)",
        "from": "Your Marriot Welcome <yourmarriotwelcome@phantomluck.com>",
        "content-type": "multipart/alternative; boundary=\"----=_SegmentBoundary_auikthxrpwogyiwhupgjfuez-3346744\"",
        "to": "megauploadsucksnow@maildig.com",
        "reply-to": "yourmarriotwelcome@phantomluck.com",
    }
  }

--smtplog:


{
  "log": [
    {
      "log": "Connection from: 64.62.203.198",
      "time": "0",
      "event": "SOCKET_OPEN"
    },
    {
      "log": "220 Mailinator.com ESMTP MailinatorSMTP",
      "time": "0",
      "event": "OUTGOING"
    },
    {
      "log": "EHLO nebula-t-dev-e2e-tests-full-mode-5474-by-jenkins-2.localdomain",
      "time": "60",
      "event": "INCOMING"
    },
    {
      "log": "250-mail.mailinator.com  250-8BITMIME  250-STARTTLS  250 Ok",
      "time": "61",
      "event": "OUTGOING"
    },
    {
      "log": "MAIL FROM:<thoughtspot-system@thoughtspot.com>",
      "time": "121",
      "event": "INCOMING"
    },
    {
      "log": "250 Ok",
      "time": "121",
      "event": "OUTGOING"
    },
    {
      "log": "RCPT TO:<tsadmin@thoughtspot.testinator.com>",
      "time": "182",
      "event": "INCOMING"
    },
    {
      "log": "501 Bad Recipient",
      "time": "182",
      "event": "OUTGOING"
    },
    {
      "log": "501 Bad Recipient",
      "time": "182",
      "event": "OUTGOING"
    },
    {
      "log": "RSET",
      "time": "265",
      "event": "INCOMING"
    },
    {
      "log": "250 Ok",
      "time": "265",
      "event": "OUTGOING"
    },
    {
      "log": "QUIT",
      "time": "326",
      "event": "INCOMING"
    },
    {
      "log": "221 Bye",
      "time": "326",
      "event": "OUTGOING"
    },
    {
      "time": "326",
      "event": "SOCKET_CLOSED"
    }
  ]
}


--links:

{ "links" : "http://www.phantomluck.com/origin/release/seemoretoday/generalline/ab44e096089cff337c38d8383b562867987/focus-center" }

--fulllinks:

{ "links" : {
       "link" : "http://www.phantomluck.com/origin/release/seemoretoday/generalline/ab44e096089cff337c38d8383b562867987/focus-center",
       "text" : "Access Pillow Set and Stay Details"
}
}





In all cases, the responses should be formatted nicely for humans.

