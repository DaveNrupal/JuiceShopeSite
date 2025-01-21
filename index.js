const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const {check, validationResult} = require('express-validator');
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/final8020', {
    useNewUrlParser: true
});

const Order = mongoose.model('Order',{
    name: String,
    phone: String,
    mangoJuices: Number,
    berryJuices: Number,
    appleJuices: Number,
    subTotal: Number,
    tax: Number,
    total: Number
} );

const Admin = mongoose.model('Admin', {
    uname: String,
    pass: String
});

var myApp = express();

 // Set up session
 myApp.use(session({
    secret: 'superrandomsecret',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
}));

//---------------- Do not modify anything above this --------------------------

myApp.set('views', path.join(__dirname, 'views'));
myApp.use(express.static(__dirname+'/public'));
myApp.set('view engine', 'ejs');

myApp.use(express.urlencoded({extended:true}));

myApp.get('/',function(req, res){
    res.render('_layouts/login')
});

myApp.get('/login', function(req,res){
    res.render('_layouts/login');
});

myApp.post('/login', async function(req,res) {
    try {
        const { uname, pass } = req.body;
        const users = await Admin.find({});
        const user = users.find(u => u.uname === uname && u.pass === pass);
        if (user) {
            if(user.uname == 'admin') {
                req.session.isAdmin = true;
            } else {
                req.session.isAdmin = false;
            }
            res.render('_layouts/orderPage',{user: req.body, isAdmin : req.session.isAdmin});
        } else {
            res.status(401).send({ error: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).send({ error: 'Login failed' });
    }
});

myApp.get('/orderPage', (req,res) => {
    res.render('_layouts/orderPage',{isAdmin : req.session.isAdmin});
})

myApp.post('/placeOrder', async (req, res) => {
    try {
        let error = [];
        const { name, mangoJuices, berryJuices, appleJuices } = req.body;
        if(!name) {
            error.push("Please enter your name!")
        }

        if(!mangoJuices || mangoJuices <= 0) {
            error.push("Please enter mango juice!")
        }

        if(!berryJuices || berryJuices <= 0) {
            error.push("Please enter berry juice!")
        }

        if(!appleJuices || appleJuices <= 0) {
            error.push("Please enter apple juice!")
        }

        if(error && error.length) {
            res.render('_layouts/errorPage',{error : error});
        } else {
            const mangoPrice = 2.99;
        const berryPrice = 1.99;
        const applePrice = 2.49;

        const subTotal = (mangoJuices * mangoPrice) + (berryJuices * berryPrice) + (appleJuices * applePrice);
        const tax = subTotal * 0.13;
        const total = subTotal + tax;

        const roundedSubTotal = parseFloat(subTotal.toFixed(2));
        const roundedTax = parseFloat(tax.toFixed(2));
        const roundedTotal = parseFloat(total.toFixed(2));

        const newOrder = new Order({
            name,
            mangoJuices,
            berryJuices,
            appleJuices,
            subTotal: roundedSubTotal,
            tax: roundedTax,
            total: roundedTotal,
        });

        await newOrder.save();
        res.render('_layouts/confirmOrder', {order : newOrder, isAdmin : req.session.isAdmin})
        }
    } catch (error) {
        res.status(500).send({ error: 'Failed to create order' });
    }
});

myApp.get('/allOrders', async (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(401).send({ error: 'Unauthorized' });
    }
    try {
        const orders = await Order.find();
        res.render('_layouts/allOrders',{orders,isAdmin : req.session.isAdmin})
    } catch (error) {
        res.status(500).send({ error: 'Failed to fetch orders' });
    }
});

myApp.post('/orders/:id', async (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(401).send({ error: 'Unauthorized' });
    }
    try {
        const { id } = req.params;
        await Order.findByIdAndDelete(id);
        const orders = await Order.find();
        res.render('_layouts/allOrders',{orders,isAdmin : req.session.isAdmin});
    } catch (error) {
        res.status(500).send({ error: 'Failed to delete order' });
    }
});

myApp.get('/logout', async (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send({ error: 'Failed to logout' });
        }
        res.render('_layouts/logout', { message: "Thank you for using the application! You are now logged out." });
    });
});

//---------------- Do not modify anything below this --------------------------
//------------------------ Setup the database ---------------------------------

myApp.get('/setup',function(req, res){
    
    let adminData = [{
        'uname': 'admin',
        'pass': 'admin'
    }];
    
    Admin.collection.insertMany(adminData);

    var firstNames = ['John ', 'Alana ', 'Jane ', 'Will ', 'Tom ', 'Leon ', 'Jack ', 'Kris ', 'Lenny ', 'Lucas '];
    var lastNames = ['May', 'Riley','Rees', 'Smith', 'Walker', 'Allen', 'Hill', 'Byrne', 'Murray', 'Perry'];

    let ordersData = [];

    for(i = 0; i < 10; i++){
        let tempName = firstNames[Math.floor((Math.random() * 10))] + lastNames[Math.floor((Math.random() * 10))];
        let tempOrder = {
            name: tempName,
            phone: Math.floor((Math.random() * 10000000000)),
            mangoJuices: Math.floor((Math.random() * 10)),
            berryJuices: Math.floor((Math.random() * 10)),
            appleJuices: Math.floor((Math.random() * 10))
        };
        ordersData.push(tempOrder);
    }
    
    Order.collection.insertMany(ordersData);
    res.send('Database setup complete. You can now proceed with your exam.');
    
});



//----------- Start the server -------------------

myApp.listen(8080);
console.log('Server started at 8080 for mywebsite...');