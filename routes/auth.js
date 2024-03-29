const router = require('express').Router();
const User = require('../models/User');
const { registerValidation, loginValidation } = require('../validation');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/register', async (req, res) => {

	//VALIDATE DATA BEFORE ADDING USER
	const {error} = registerValidation(req.body);
	if (error) return res.status(400).send(error.details[0].message);

	// CHECK IF USER ALREADY EXISTS
	const emailExist = await User.findOne({email: req.body.email});
	if (emailExist) return res.status(400).send('Email already exists');

	//HASH THE PASSWORD
	const salt = await bcrypt.genSalt(10);
	const hashPassword = await bcrypt.hash(req.body.password, salt);

	//CREATE NEW USER

	const user = new User ({
		email: req.body.email,
		password: hashPassword
	});

	try {
		const savedUser = await user.save();
		res.send({user: user._id});
	} catch(err){
		res.status(400).send(err);
	}

});


//LOGIN
router.post('/login', async (req, res) => {

	//VALIDATE USER
	const {error} = loginValidation(req.body);
	if (error) return res.status(400).send(error.details[0].message);

	// CHECK IF EMAIL ALREADY EXISTS
	const user = await User.findOne({ email: req.body.email });
	if (!user) return res.status(400).send('Email or password is wrong');

	//PASSWORD IS CORRECT
	const validPassword = await bcrypt.compare(req.body.password, user.password);
	if (!validPassword) return res.status(400).send('Wrong password');

	//CREATE AND ASSIGN TOKEN
	const token = jwt.sign( {_id: user._id }, process.env.TOKEN_SECRET);
	res.header('auth-token', token).json(token);


	});

module.exports = router;
