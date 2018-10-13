// let me plan my api structure/design, you know just the things i need to do
// ---root route = this should respond with this is working
// signIn ==> POST = should return success/fail
// register ===> POST = this should return the new user
// profile/userId ===> GET = requested user

const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const knex = require('knex');
const cors = require('cors');

const app = express();
app.use(bodyParser.json())
app.use(cors())

 const db = knex({
    client: 'pg',
    connection: {
        connectionString: process.env.DATABASE_URL,
        ssl: true,
    }
  });
  db.select('*').from('users').then(data => {
      console.log(data)
  });

//const dataBase = {
    // users: [
    //     {
    //         id: '123',
    //         name: 'dozie',
    //         email: 'dozie@gmail.com',
    //         password: 'password',
    //         searches: 0,
    //         joined: new Date()
    //     },
    //     {
    //         id: '125',
    //         name: 'ugo',
    //         email: 'ugo@gmail.com',
    //         password: 'another',
    //         searches: 0,
    //         joined: new Date()
    //     }
    // ]
//}
// time for me to do the register
app.post('/register', (req, res) => {
    const { name, email, password } = req.body
    const hash = bcrypt.hashSync(password);
    db.transaction(trx => {
        trx.insert({
            hash: hash,
            email: email
        }).into('login').returning('email').then(loginEmail => {
            return trx('users')
                .returning('*')
                .insert({
                    email: loginEmail[0],
                    name: name,
                    joined: new Date()
                }).then(user => {
                    res.json(user[0]);
                    res.end('this was successful')
                })
            })
            .then(trx.commit)
            .catch(trx.rollback)
    }) 
    .catch(err => {
        res.status(400).json('unable to join')
    })
})
// this is the home endpoint, i never know wetin i go use am for
app.get('/', (req, res) => {
    res.send('it is now working');
})
// this is the api/endpoint to register the user to the database
app.post('/sign-in', (req, res) => {
   db.select('email', 'hash').from('login')
   .where('email', '=', req.body.email)
   .then(data => {
        const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
        if (isValid) {
            return db.select('*').from('users')
            .where('email', '=', req.body.email)
            .then(user => {
                res.json(user[0])
            })
            .catch(err => res.status(400).json('unable to get user'))
        } else {
            res.status(400).json('wrong credentials')
        }
   })
})
// this is to get each registered user,and also display the details of the user
app.get('/profile/:id', (req,res) => {
    const { id } = req.params;
    db.select('*')
    .returning()
    .from('users')
    .where({ id }).then(user => {
        res.json(user)
    })
})
// this is to know to amount of time a user has searched for on the app
app.post('/number-of-searches', (req,res) => {
    const { id } = req.body;
    let found = false;
    dataBase.users.forEach( user => {
        if (user.id === id) {
            found = true;
            user.searches++;
            return res.json(user.searches);
        }
    })
    if (!found) {
        res.status(400).json('user not found');
    }
})

app.listen(process.env.PORT || 4000, () => {
    console.log(`app listening on port ${process.env.PORT}`);
})