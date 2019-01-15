const inquirer = require("inquirer");
const chalk = require("chalk");
const figlet = require("figlet");
const shell = require("shelljs");
const fs = require('fs');

const Sequelize = {
    UUID: 'varchar(255)',
    STRING: 'varchar(255)',
    CHAR: 'char(255)',
    TINYINT: 'TINYINT(8)',
    SMALLINT: 'SMALLINT(16)',
    MEDIUMINT: 'MEDIUMINT(24)',
    INTEGER: 'INTEGER',
    BIGINT: 'BIGINT',
    FLOAT: 'FLOAT',
    REAL: 'REAL',
    DOUBLE: 'DOUBLE',
    DECIMAL: 'DECIMAL',
    BLOB: 'TEXT',
    DATE: 'DATE',
    DATEONLY: 'DATE',
    TIME: 'DATETIME',
    TEXT: 'TEXT',
    BOOLEAN: 'BOOL',
    ENUM: 'enum'
}

const init = () => {
    console.log(
        chalk.green(
            figlet.textSync("Sequelize Inverse Model", {
                font: "Standard",
                horizontalLayout: "default",
                verticalLayout: "default"
            })
        )
    );
};

const askQuestions = () => {
    const questions = [
        {
            name: "DB",
            type: "input",
            message: "What is the name of the database?"
        },
        {
            name: "TABLE",
            type: "input",
            message: "What is the name of the table?"
        },
        {
            name: "MODEL",
            type: "editor",
            message: "Paste the fields of the model you want to transform here:"
        },
        {
            name: "QUERY",
            type: "list",
            message: "Do you want to create the .sql with the obtained result?",
            choices: ["Yes", "No"]
        }
    ];
    return inquirer.prompt(questions);
};

const createFile = (filename, Query) => {
    const filePath = `${process.cwd()}/${filename}.sql`
    shell.touch(filePath);
    fs.appendFile(`${filename}.sql`, Query, function (err) {
        if (err) throw err;
    });
    return filePath;
};

const successFile = filepath => {
    console.log(
        chalk.bgMagentaBright(`Done! File created at ${filepath}`)
    );
};

const successTransform = (DB, Table, { Query, Keys }) => {

    const result = `
    CREATE TABLE ${DB}.${Table} (
        ${Query} ${Keys}
    )
    ENGINE=InnoDB
    DEFAULT CHARSET=utf8
    COLLATE=utf8_unicode_ci;
    `;
    console.log(
        chalk.magenta(`${result}`)
    );
    return result;
};

const transform = (Table, Model) => {

    let fields = JSON.parse(JSON.stringify(eval("(" + Model + ")")));
    let Query = '';
    let Keys = '';

    for (const key in fields) {
        if (fields.hasOwnProperty(key)) {
            const value = fields[key];

            let extra = '';

            Keys += 'primaryKey' in value ? `CONSTRAINT ${Table}_PK PRIMARY KEY (${key})
            `: '';

            if (value.type === 'enum') {
                value.type = `enum(${"'" + value.values.join(",").replace(/,/g, "','") + "'"})`
            }

            extra += 'defaultValue' in value ? ` DEFAULT ${value.defaultValue} ` : '';
            extra += 'allowNull' in value ? 'NOT NULL' : 'NULL';

            Query += `${key} ${value.type} ${extra},
        `;
        }
    }

    /*Query += `cretatedAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL,
    `;*/

    return { Query, Keys };

}

const run = async () => {
    try {
        // show script introduction
        init();

        // ask questions
        const answers = await askQuestions();
        const { DB, TABLE, MODEL, QUERY } = answers;

        // Transform
        const TRANSFORM = transform(TABLE, MODEL);
        // Success Transform
        const RESULT = await successTransform(DB, TABLE, TRANSFORM);

        if (QUERY === 'Yes') {
            // create the file
            const filePath = createFile(TABLE, RESULT);
            // show success message
            successFile(filePath);
        }

    } catch (error) {
        console.log({ error });
    }
};

run();