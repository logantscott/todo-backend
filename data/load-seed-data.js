const client = require('../lib/client.js');

// import our seed data:
const todos = require('./todos');

run();

async function run() {

    try {
        await client.connect();

        await client.query(`
            INSERT INTO users (name, email, hash)
            VALUES ($1, $2, $3);
        `,
        ['logan', 'sky@bagel.com', '$2a$08$H1IH1MHdd.pJaoCxttuh2.KDVgleHZC9gB6gR8jg0Iyd7NV3Y6zPm']);

        await Promise.all(
            todos.map(todo => {
                return client.query(`
                    INSERT INTO todos (task, complete, user_id)
                    VALUES ($1, $2, $3);
                `,
                [todo.task, todo.complete, todo.user_id]);
            })
        );

        console.log('seed data load complete');
    }
    catch (err) {
        console.log(err);
    }
    finally {
        client.end();
    }
    
}