var express = require('express');
var body_parser = require('body-parser')
var path = require('path');
var MongoClient = require('mongodb').MongoClient;

var mongo_url = "mongodb://localhost:27017/reverse_auction";


var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.engine('html', require('ejs').renderFile);

app.use(body_parser.json());
app.use(express.static(__dirname + '/public'));

app.set('views', path.join(__dirname,'views'));
app.set('view engine', 'html');

app.get('/',function(req,res){
    res.render('index.html');
});


//Auction channels
io.on('connection', function(socket){

});


//Buyers
app.post('/auctions',function(req,res){
    var auction = req.body;



    MongoClient.connect(mongo_url,function(err,db){
        //Create an auction
        //You need an item name and price to create an auction
        //This should trigger the creation realtime auction websocket
        //involving the buyer and the relevant sellers
        db.collection('auctions').insertOne(auction,function(err,auction_document){
            db.close();

            io.of('/'+ auction_document.insertedId).emit('message', {type:'text',text:'I am alerting prospective bidders'});
            res.send({code:0,message:'Auction created',results:{auctionId:auction_document.insertedId}});
        });

    });


});


//Sellers
app.post('/bids',function(req,res){
    var bid = req.body;

    MongoClient.connect(mongo_url,function(err,db){
        var choice = Math.floor(Math.random() * 2);
        switch (choice){
            case 0:
                bid = {
                    auctionId:bid.auctionId,
                    type:'text',
                    text:'Hello from nestle'
                };
                break
            case 1:
                bid = {
                    auctionId:bid.auctionId,
                    type:'item',
                    name:'Sobolo',
                    citation:'Amazon',
                    image:'https://placehold.it/60x60',
                    checkout:'http://google.com',
                    currency:'$',
                    price:20
                };
        }


        db.collection('bids').insertOne(bid,function(err,bid_document){
            bid.id = bid_document.insertedId;
            db.close();

            io.of(bid.auctionId).emit('message', bid);
            res.send({code:0,message:'Bid created',results:{}});
        });

    });

});


http.listen(3000,function(){
   console.log('reverse-auction listening on port 3000');
});