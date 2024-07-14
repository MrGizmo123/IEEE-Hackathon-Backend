const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const fs = require('node:fs');

const hostname = 'localhost'
const port = 3000;

const data_file = 'data.json'

const app = express();
const server = createServer(app);
const io = new Server(server);

// amount can be positive for income, negative for expense
function createFinancialElement(amount, frequency, _tags)
{
    return {amt: amount, freq: frequency, tags: _tags};
}

// adds a new user to the database
function createUser(_name, _passhash)
{
    return {name: _name, pass: _passhash, f_elements: []};
}

function saveState()
{
    try
    {
	fs.writeFileSync(data_file, JSON.stringify(users));
    }
    catch (err)
    {
	console.error("Failed to write user data")
	console.error(err);
    }
}

users = {};

try
{
    users = fs.readFileSync(data_file, 'utf8');
}
catch (err)
{
    console.error("[WARN NON FATAL]: Unable to read datafile");
    console.error(err);
}

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    console.log('client connected')

    // fetch all the data from server side
    // arg is {user: <username>, pass: <passhash>}
    socket.on('get data', (arg) => {

	if (arg["user"] in users)
	{
	    user = users[arg["user"]];
	    if (user["pass"] == arg["pass"]) // check if password correct
	    {
		socket.emit('send data', users[arg["pass"]]);
	    }
	    else
	    {
		socket.emit('show error', 'Wrong password')
	    }
	}
	else
	{
	    socket.emit('show error', 'Unknown username')
	}
    });
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});

// write the users variable(the database back to disk)
process.on('exit', (code) => {
    saveState();
});

process.on('SIGINT', (code) => {
    saveState();
});

process.on('SIGTERM', (code) => {
    saveState();
});
