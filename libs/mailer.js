var nodemailer = require('nodemailer');

module.exports.send = function (email, mailOptions) {
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        secureConnection: false,
        auth: {
            user: 'matcha.unitschool@gmail.com',
            pass: '19983562ujif'
        }
    });

    // html mail
    // var mailOptions = {
    //     from    : 'matcha.unitschool@gmail.com',
    //     to      : email,
    //     subject : 'Matcha, registration. Confirm your account.',
    //     html    : (
    //         '<td align="right">'+
    //         '<table border="0" cellpadding="0" cellspacing="0" style=\"width: 75%;max-width:600px;display: block;margin: 0 auto;height: 100%;\">'+
    //         '<tbody style="width: 100%;display: block;margin: 0 auto; background: #557780;padding: 10px;">'+
    //         '<tr>'+
    //         '<td>'+
    //         '<a href="http://www.twitter.com/">'+
    //         '<img src="../../images/userPhotos/test-user/1.jpg" alt="Twitter" width="38" height="38" style="display: block;" border="0" />'+
    //         '</a>'+
    //         '</td>'+
    //         '<td style="font-size: 0; line-height: 0;" width="20">&nbsp;</td>'+
    //         '<td>'+
    //         '<a href="http://www.twitter.com/">'+
    //         '<img src="../../images/userPhotos/test-user/1.jpg" alt="Facebook" width="38" height="38" style="display: block;" border="0" />'+
    //         '</a>'+
    //         '</td>'+
    //         '<td style="font-size: 0; line-height: 0;" width="20">&nbsp;</td>'+
    //         '<td>'+
    //         '<h1 style="margin: 0; color: #fff;">Matcha</h1>'+
    //         '</td>'+
    //         '</tr>'+
    //         '</tbody>'+
    //         '<tbody style="display:block;height: 200px; background: #EBE1E2;width:100%;padding:10px;padding-top:100px;">'+
    //         '<tr style="width: 100%;display: block;text-align: -webkit-center;">'+
    //         '<td><h2 style="font-weight: 800;margin:0;">Confirm your account, click on link below</h2></td>'+
    //         '</tr>'+
    //         '<tr style="width:100%;display:block;text-align:-webkit-center;text-align:center;">'+
    //         '<td style="width: 100%;display: block;">'+
    //         '<a href="http://localhost:3000/access?acc='+userKey+'" style="width:100%;display:block;"><h2 style="font-weight: 800;">http://localhost:3000</h2>'+
    //         '</a>'+
    //         '</td>'+
    //         '</tr>'+
    //         '</tbody>'+
    //         '</table>'+
    //         '</td>'
    //     )
    // };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}