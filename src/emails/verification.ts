export const verificationTemplate = `<html>

<head>
    <meta charset="UTF-8">
    <title>Email de Verificação</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap');

        .roboto {
            font-family: "Roboto", sans-serif;
            font-optical-sizing: auto;
            font-weight: <weight>;
            font-style: normal;
            font-variation-settings:
                "wdth" 100;
        }

        body {
            display: flex;
            justify-content: center;
            align-items: center;
            font-style: "Roboto";
            text-align: center;
            border: 4px solid gray;
            border-radius: 20px
        }

        .section {
            display: block;
            text-align: center;
        }

        .title {
            font-size: 128px;
            color: #37BFED;
        }

        .paragraph {
            font-size: 24px;
        }
    </style>
</head>

<body class="roboto">
    <div class="section">
        <h1 class="title">ULTRA NX</h1>
        <div>
            <h3 class="paragraph">Seu código de verificação é <strong>$verificationCode</strong>.</h3>
            <h5 class="paragraph">Este código expira em 15 minutos.</h5>
        </div>
    </div>
</body>

</html>`;
