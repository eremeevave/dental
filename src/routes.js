const path = require('path')
const db = require('./db_connection')
const bcrypt = require('bcrypt')

function isAuthenticated(req, res, next){
    if(req.session.user_id){
        return next()
    }   
    res.redirect('/user-login')
}

module.exports = (app) => {

    app.get('/', (req, res) => {
        res.sendFile(path.resolve(__dirname + '/../views/html/index.html'))
    })

    app.get('/user-login', (req, res) => {
        res.sendFile(path.resolve(__dirname + '/../views/html/log-into.html'))
    })

    app.get('/user-register', (req, res) => {
        res.sendFile(path.resolve(__dirname + '/../views/html/reg-form.html'))
    })

    app.get('/doctor-profile', isAuthenticated, (req, res) => {
        res.sendFile(path.resolve(__dirname + '/../views/html/doctor-profile.html'))
    })

    app.get('/user-profile', isAuthenticated, (req, res) => {
        res.sendFile(path.resolve(__dirname + '/../views/html/profile.html'))
    })

    app.get('/doctor-register', (req, res) => {
        res.sendFile(path.resolve(__dirname + '/../views/html/doctor-registration.html'))
    })

    app.get('/visit', isAuthenticated, (req, res) => {
        res.sendFile(path.resolve(__dirname + '/../views/html/visit.html'))
    })

    app.get('/logout', (req, res) => {
        req.session.destroy()
        res.clearCookie("client_id")
        res.clearCookie("doctor_id")
        res.redirect(301, '/')
    })

    app.post('/user-register', (req, res) => {
        const fname = req.body.fname
        const lname = req.body.lname
        const email = req.body.email
        const date = req.body.birthdate
        const additional = req.body.additionalfield
        const hashpassword = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(8), null) 
        db.query(`SELECT * FROM Patient WHERE p_email='${email}'`, (err, results, fields) => {
            if (err) res.redirect('/user-register')
            if(results.length === 0){
                db.query(`SELECT * FROM Doctors WHERE d_email='${email}'`, (err, results, fields) => {
                    if (err) res.redirect('/user-register')
                    if(results.length === 0){
							db.query(`Call Patient_insert (?, ?, ?, ?, ?, ?)`, 
                            [fname, lname, email, date, additional, hashpassword], (err, results, fields) =>{
                           if(err) {
                               console.log(err)
                               res.redirect('/user-register')
                           }
                           if(results) res.redirect('/user-login')
                       })
                    } else {
                        res.redirect('/user-register')
                    }
                })
            } else {
                res.redirect('/user-register')
            }
        })
    })

    app.post('/doctor-register', (req, res) => {
        const fname = req.body.fname
        const lname = req.body.lname
        const email = req.body.email
        const start_time = req.body.starttime
        const end_time = req.body.endtime
        const services = req.body.services
        const password = req.body.password
        const hashpassword = bcrypt.hashSync(password, bcrypt.genSaltSync(8), null) 
        const token = req.body.token
        const startT = Number(start_time.replace(":", "").substring(0, 4))
        const endT = Number(end_time.replace(":", "").substring(0, 4))

        if(fname.length < 4 || fname.length > 10){
            console.log(fname)
            return res.send({code: 1, message: "Please enter name in range of 4 and 10 characters"})
        }
        if(lname.length < 4 || lname.length > 10){
            console.log(lname)
            return res.send({code: 1, message: "Please enter surname in range of 4 and 10 characters"})
        }
        if(services.length < 1){
            console.log(services)
            return res.send({code: 1, message: "Please enter just one service"})
        } 
        if(password.length < 4 || password.length > 15){
            console.log(password)
            return res.send({code: 1, message: "Please enter password in range of 4 and 15 characters"})
        } 
        if(token.length < 4 || token.length > 10){
            console.log(token)
            return res.send({code: 1, message: "Please enter token in range of 4 and 10 characters"})
        } 

        if(endT < startT || (endT-startT) < 300 || startT < 900 || endT > 2000){
            return res.send({code: 1, message: "Please choose date in range 09:00 and 20:00"})
        } 

        db.query(`SELECT * FROM Tokens WHERE token = ?`, [token], (err, results, fields) => {
            if(err) return res.send({code: 1, message: err.message})
            if(results.length !== 0 && results[0].d_id == null){
               
                db.query(`SELECT * FROM Doctors WHERE d_email = ?`, [email], (err, results, fields) => {
                    if (err) return res.send({code: 1, message: err.message})
                    if(results.length === 0){

                        db.query(`SELECT * FROM Patient WHERE p_email = ?`, [email], (err, results, fields) => {
                            if (err) return res.send({code: 1, message: err.message})
                            if(results.length === 0){
							 
                                db.query(`Call Doctor_insert (?, ?, ?, ?, ?, ?)`, 
                                    [fname, lname, start_time, end_time, email, hashpassword], (err, results, fields) =>{
                                    if(err) return res.redirect('/doctor-register')
        
                                    db.query(`SELECT d_id FROM Doctors WHERE d_email = ?`, [email], (err, results, fields) => {
                                        if(err) return res.send({code: 1, message: err.message})
                                        const doctor_id = results[0].d_id
        
                                        db.query(`UPDATE Tokens SET d_id = ? WHERE token = ?`, 
                                            [doctor_id, token], (err, results, fields) => {
                                            if(err) return res.send({code: 1, message: err.message})
                                            if(results) res.redirect('/user-login')
                                        })

                                        for(let i = 0; i < services.length; i++){
                                            db.query(`INSERT INTO DocServ(d_id, s_id) VALUES(?, ?)`, 
                                                [doctor_id, services[i]], (err, results) => {
                                                if(err) res.send({code: 1, message: err.message})
                                                //if(results) res.send({code: 0, message: "Doctor succesfully registered"})
                                            })
                                        }
                                    })
                                })
                            }
                        })
                    } else {
                        res.send({code: 1, message: "User with the same email already exist"})// 
                    }
                })
            } else {
                res.send({code: 1, message: "Token is not exist or not valid"})
            }
        })
    })


    app.post('/user-login', (req, res, next) => {
        const email = req.body.email
        const password = req.body.password

        db.query(`SELECT p_id, p_password FROM Patient WHERE p_email = ?`, [email], (err, results, fields) => {
            if(err) res.redirect('/user-login')
            const client = results[0]
            if(results.length === 1 && bcrypt.compareSync(password, client.p_password)){
                req.session.user_id = client.p_id
                res.cookie('client_id', client.p_id)
                res.clearCookie("doctor_id")
                res.redirect('/user-profile')
            } else {
                db.query(`SELECT d_id, d_password FROM Doctors WHERE d_email = ?`, [email], (err, results, fields) => {
                    if(err) res.redirect('/user-login')
                    const doctor = results[0]
                    if(results.length !== 0 && bcrypt.compareSync(password, doctor.d_password)){
                        req.session.user_id = doctor.d_id
                        res.cookie('doctor_id', doctor.d_id)
                        res.clearCookie("client_id")
                        res.redirect('/doctor-profile')
                    } else {
                        res.redirect('/user-login')
                    }
                })
            }
        })
    })

    app.get('/getServices', (req, res) => {
        const doctor_id = String(req.query.doctor_id)
        db.query(`SELECT Services.s_name, Services.s_price FROM DocServ \
        INNER JOIN Services ON Services.s_id=DocServ.s_id WHERE DocServ.d_id = ?`,
        [doctor_id], (err, results) => {
            if(err) res.send(err)
            res.send(results)
        })
    })

    app.get('/getDoctorsByServices', (req, res) => {
        const service_id = String(req.query.service_id)
        db.query(`SELECT Doctors.d_id, Doctors.d_lastname, Services.s_price FROM ((DocServ INNER JOIN Doctors \
        ON Doctors.d_id=DocServ.d_id) INNER JOIN Services ON Services.s_id=DocServ.s_id) \
        WHERE DocServ.s_id = ${service_id}`, (err, results) => {
            if(err) res.send(err)
            res.send(results)
        })
    })

    app.post('/recordVisit', (req, res, next) => {
        const p_id = req.body.p_id
        const s_id = req.body.s_id
        const d_id = req.body.d_id
        let v_date = req.body.visitdate
        let v_time = req.body.visittime
        v_time = v_time+':00'
        const v_price = req.body.v_price
        const two = v_time.replace(":", "").substring(0, 4)

        const startT = Number(v_time.replace(":", "").substring(0, 4))

        if(startT < 900 || startT > 2000){
            return res.json({code: 1, message: "Please choose date in range 09:00 and 20:00"})
        } 

        db.query(`SELECT Visit.v_time, Doctors.d_start_time, Doctors.d_end_time FROM \
                Visit INNER JOIN Doctors ON Doctors.d_id=Visit.d_id WHERE Doctors.d_id = ? AND \
                v_date=CAST(? AS date)`, [d_id, v_date], (err, results) => {
            if(err) next(err)
            if(results.length !== 0){
                v_date = v_date.replace("-", "/")
                v_date = v_date.replace("-", "/")
                const startD = new Date(v_date + " " + results[0].d_start_time).getHours()
                // const endD = new Date(v_date + " " + results[0].d_end_time).getHours()
                // const time = new Date(v_date + " " + v_time).getHours()

                const start_time = results[0].d_start_time.replace(":", "").substring(0, 4)
                const end_time = results[0].d_end_time.replace(":", "").substring(0, 4)
            
                for(let i = 0; i < results.length; i++){
                    const timefromtable = results[i].v_time.replace(":", "").substring(0, 4)
                    if(Math.abs(timefromtable - two) < 100){
                        return res.json({code: 1, message: "This time is reserved"})
                    }

                    if(two <= start_time || two >= end_time){
                        return res.json({code: 1, message: "Doctor is not working in that time"})
                    }
                }
            } else {
                db.query(`SELECT d_start_time, d_end_time FROM Doctors WHERE d_id = ?`, [d_id], (err, results) => {
                    if(err) next(err)
                    const start_time = results[0].d_start_time.replace(":", "").substring(0, 4)
                    const end_time = results[0].d_end_time.replace(":", "").substring(0, 4)
                    if(two <= start_time || two >= end_time){
                        return res.json({code: 1, message: "Doctor is not working in that time"})
                    }
                })
            }

            db.query(`INSERT INTO Visit(p_id, s_id, d_id, v_date, v_time, v_price)\
                    VALUES(?, ?, ?, CAST(? AS date), CAST(? AS time), ?)`, 
                    [p_id, s_id, d_id, v_date, v_time, v_price], (err, results) => {
                if(err) next(err)
                if(results) return res.json({code: 0, message: "Successfuly recorded visit"})
            })
        })
    }, (err, req, res, next) => {
        if(err) res.json({code: 1, message: err})
    })

    app.get('/getVisits', (req, res) => {
        const doctor_id = req.query.doctor_id

        db.query(`SELECT Visit.v_date, Visit.v_time, Visit.v_price, Patient.p_firstname, Patient.p_lastname, \
            Services.s_name FROM (((Visit INNER JOIN Patient ON Visit.p_id=Patient.p_id) INNER JOIN DocServ ON \
            Visit.d_id=DocServ.d_id) INNER JOIN Services ON Services.s_id=Visit.s_id) WHERE Visit.d_id = ?\
            ORDER BY Visit.v_date`, [doctor_id], 
        (err, results) => { 
            if(err) return res.send({code: 1, message: err})
            if(results) {
                let response = []
                for(let i = 0; i < results.length; i++){
                    if(i % 10 == 0) {
                        results[i].v_date = results[i].v_date.toLocaleString().split(',')[0]
                        response.push(results[i])
                    }
                }
                return res.send({code: 0, message: response})
            }
        })
    })
}