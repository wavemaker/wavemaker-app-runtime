<html>

<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Continue to App</title>
    <style>
        .flex {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-flow: column;
        }

        .link {
            background: green;
            padding: 10pt;
            text-decoration: none;
            color: #ffffff;
            font-weight: bold;
            border-radius: 4pt;
        }

        .message {
            text-align: center;
            padding: 10pt;
            width: 240pt;
            color: #666;
            font-size: 11pt;
        }
    </style>
    <script>
        function closeWindow() {
            // In some phones, closing the window immediately will block the navigation to app.
            setTimeout(function() {
                window.close();
            }, 100);
        }
    </script>
</head>

<body class="flex">
<label class="message">You have successfully logged in. Please click the below button to navigate to the app.</label>
<a class="link" href="${appLink}" onClick="javascript:closeWindow()">Continue to App</a>

</body>

</html>