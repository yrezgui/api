var supertest   =   require('supertest');
var mandrill    =   supertest('https://mandrillapp.com/api/1.0/');
var config      =   require('./../../config.js');

var User        =   db.collection('user');
var ObjectID    =   require('mongodb').ObjectID;
function getId(id) {
    return new ObjectID(id);
}



exports.inboundMessage = function(req, res) {
    var inbound = JSON.parse(req.body.mandrill_events)[0].msg;

    res.send('ok');

    var outbound = {
        "key": config.param('mandrill_key'),
        "message": {
            "html": "",
            "text": "Example text content",
            "subject": "History Text Book",
            "from_email": "",
            "from_name": "",
            "to": [
                {
                    "email": "",
                    "name": ""
                }
            ],
            "headers": {
                "Reply-To": "hello"
            }
        }
    };
    var to_prefix = inbound.email.split('@')[0];
    User.findAndModify(
        {email: inbound.from_email},
        [],
        {$inc: {message_sent: 1}},
        {new: true},
        function(err, sender) {
            if(sender.username) {
                outbound.message.from_email = sender.username + '@mail.benkyet.com';
                outbound.message.from_name = sender.username;
            } else {
                outbound.message.from_email = sender._id + '@mail.benkyet.com';
                outbound.message.from_name = sender._id;
            }

            var query;
            if(to_prefix.length === 24) {
                query = {_id: getId(to_prefix)};
            } else {
                query = {username: to_prefix};
            }

            User.findOne(
                query,
                function(err2, recepient) {
                    if(recepient.username) {
                        outbound.message.to[0].email = recepient.email;
                        outbound.message.to[0].name = recepient.username;
                    } else {
                        outbound.message.to[0].email = recepient.email;
                        outbound.message.to[0].name = recepient._id;
                    }

                    outbound.message.html = inbound.html;

                    mandrill.post('/messages/send.json')
                        .send(outbound)
                        .end(function(m_err, m_res) {
                            var response_mandrill = m_res.body[0];
                            console.log(response_mandrill);
                        });

                }
            )
        }
    );
}

exports.addMessageToDb = function(req, res) {
    var data = req.body;

    var message = {
        "key": config.param('mandrill_key'),
        "message": {
            "html": "<p>"+data.message.body+"</p>",
            "text": "Example text content",
            "subject": "History Text Book",
            "from_email": "",
            "from_name": data.message.name,
            "to": [
                {
                    "email": "",
                    "name": "hello"
                }
            ],
            "headers": {
                "Reply-To": "hello"
            }
        }
    };


    User.findOne({_id: getId(data.seller_id)}, function(err, doc) {
        message.message.to[0].email = doc.email;
        message.message.to[0].name = doc.username;

        User.findAndModify(
            {email: data.message.email},
            [],
            {$inc: {message_sent: 1}},
            {upsert: true, new: true},
            function(err2, sender) {
                console.log(err2, sender)
                message.message.from_email = sender.email.split('@')[0] + '@mail.benkyet.com';

                mandrill.post('/messages/send.json')
                    .send(message)
                    .end(function(m_err, m_res) {
                        var response_mandrill = m_res.body[0];
                        var response = {
                            status: response_mandrill.status,
                            email: response_mandrill.email
                        };
                        console.log(response);
                        response_mandrill.status === 'sent' || 'queued' ? res.status(200).json(response) : res.status(400);
                    });
            }
        )

    });
};