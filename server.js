const express = require('express')
const cors = require('cors');
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');
const db_access = require('./Db.js')
const db = db_access.db
const cookieParser = require('cookie-parser');
const server = express()
const port = 555
const secret_key = 'DdsdsdKKFDDFDdvfddvxvc4dsdvdsvdb'
server.use(cors({
    origin:"http://localhost:3000",
    credentials:true
}))
server.use(express.json())
server.use(cookieParser())
const generateToken = (id, isAdmin) => {
    return jwt.sign({ id, isAdmin }, secret_key, { expiresIn: '1h' })
}
const verifyToken = (req, res, next) => {
    const token = req.cookies.authToken
    if (!token)
        return res.status(401).send('unauthorized')
    jwt.verify(token, secret_key, (err, details) => {
        if (err)
            return res.status(403).send('invalid or expired token')
        req.userDetails = details

        next()
    })
}
server.post('/user/login', (req, res) => {
    const email = req.body.email
    const password = req.body.password
    db.get(`SELECT * FROM USER WHERE EMAIL=?  `, [email], (err, row) => {
        bcrypt.compare(password, row.PASSWORD, (err, isMatch) => {
            if (err) {
                return res.status(500).send('error comparing password.')
            }
            if (!isMatch) {
                return res.status(401).send('invalid credentials')
            }
            else {
                let userID = row.ID
                let isAdmin = row.ISADMIN
                const token = generateToken(userID, isAdmin)

                res.cookie('authToken', token, {
                    httpOnly: true,
                    sameSite: 'none',
                    secure:true,
                    expiresIn: '1h'
                })
                return res.status(200).json({ id: userID, admin: isAdmin })
            }
        })
    })
})

server.post(`/user/register`, (req, res) => {
    const name = req.body.name
    const email = req.body.email
    const password = req.body.password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            return res.status(500).send('error hashing password')
        }
        db.run(`INSERT INTO USER (name,email,password,isadmin) VALUES (?,?,?,?)`, [name, email, hashedPassword, 0], (err) => {
            if (err) {

                return res.status(401).send(err)
            }
            else
                return res.status(200).send(`registration successfull`)
        })
    })
})


server.post(`/flights/addflight`, verifyToken, (req, res) => {
    const isAdmin = req.userDetails.isAdmin;
    if (isAdmin !== 1)
        return res.status(403).send("you are not an admin")
    const home = req.body.home
    const away = req.body.away
    const date = req.body.date
    const quantity = parseInt(req.body.quantity, 10)
    let query = `INSERT INTO FLIGHT (HOME,AWAY,DATE,QUANTITY) VALUES
    (?,?,?,?)`
    db.run(query, [home, away, date, quantity], (err) => {
        if (err) {
            console.log(err)
            return res.send(err)
        }
        else {
            return res.send(`flight added successfully`)
        }
    })

})

server.get(`/flights`, verifyToken, (req, res) => {
    const isAdmin = req.userDetails.isAdmin;
    if (isAdmin !== 1)
        return res.status(403).send("you are not an admin")
    const query = `SELECT * FROM FLIGHT`
    db.all(query, (err, rows) => {
        if (err) {
            console.log(err)
            return res.send(err)
        }
        else {
            return res.json(rows)
        }
    })
})

server.get(`/flights/search/:id`, (req, res) => {
    const query = `SELECT * FROM FLIGHT WHERE ID=${req.params.id}`
    db.get(query, (err, row) => {
        if (err) {
            console.log(err)
            return res.send(err)
        }
        else if (!row)
            return res.send(`flight with id ${req.params.id} not found`)
        else
            return res.send(row)
    })
})

server.put(`/flights/edit/:id/:quantity`, verifyToken, (req, res) => {
    const isAdmin = req.userDetails.isAdmin;
    if (isAdmin !== 1)
        return res.status(403).send("you are not an admin")
    const query = `UPDATE FLIGHT SET QUANTITY=${parseInt(req.params.quantity, 10)}
    WHERE ID=${req.params.id}`

    db.run(query, (err) => {
        if (err) {
            console.log(err)
            return res.send(err)
        }
        else {
            return res.send(`flight updated successfully`)
        }
    })
})

server.get(`/flights/search`, (req, res) => {
    let home = req.query.home
    let away = req.query.away
    let date = req.query.date
    let query = `SELECT * FROM FLIGHT WHERE QUANTITY>0`
    if (home)
        query += ` AND HOME='${home}'`
    if (away)
        query += ` AND AWAY='${away}'`
    if (date)
        query += ` AND DATE='${date}'`

    db.all(query, (err, rows) => {
        if (err) {
            console.log(err)
            return res.send(err)
        }
        else {
            return res.json(rows)
        }
    })

})

server.put(`/book`, verifyToken, (req, res) => {
    const isAdmin = req.userDetails.isAdmin;
    if (isAdmin !== 1)
        return res.status(403).send("you are not an admin")
    let home = req.query.home
    let away = req.query.away
    let date = req.query.date
    let query = `SELECT * FROM FLIGHT WHERE HOME='${home}'
    AND AWAY='${away}' AND DATE='${date}'`

    db.get(query, (err, row) => {
        if (err) {
            console.log(err)
            return res.send(err)
        }
        else {

            let flightID = row.ID
            let userID = req.body.userID
            let query2 = `INSERT INTO BOOKING (USER_ID,FLIGHT_ID) VALUES (${parseInt(userID, 10)},${flightID})`
            console.log(query2)
            db.run(query2, (err) => {
                if (err) {
                    console.log(err)
                    return res.send(err)
                }
                else {

                    let quantity = parseInt(row.QUANTITY, 10)
                    quantity = quantity - 1
                    query = `UPDATE FLIGHT SET QUANTITY=${quantity} WHERE ID=${flightID}`
                    console.log(query)
                    db.run(query, (err) => {
                        if (err) {
                            console.log(err)
                            return res.send(err)
                        }
                        else
                            res.send(`booked successfully`)
                    })
                }

            })
        }
    }
    )
})

server.listen(port, () => {
    console.log(`server started at port ${port}`)
    db.serialize(() => {
        db.run(db_access.createUserTable, (err) => {
            if (err)
                console.log("error creating user table " + err)
        });
        db.run(db_access.createFlightTable, (err) => {
            if (err)
                console.log("error creating flight table " + err)
        });
        db.run(db_access.createBookingTable, (err) => {
            if (err)
                console.log("error creating booking table " + err)
        });
    })



})
