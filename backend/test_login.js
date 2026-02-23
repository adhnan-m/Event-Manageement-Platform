const fetch = require('node-fetch'); // You might need to install this or use built-in fetch if node version > 18

async function testLogin() {
    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'ad@gmail.com',
                password: '123456'
            })
        });

        const status = response.status;
        const text = await response.text();

        console.log(`Status: ${status}`);
        console.log(`Body: ${text}`);

    } catch (error) {
        console.error('Error:', error);
    }
}

testLogin();
