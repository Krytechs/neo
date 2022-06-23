import chalk       from 'chalk';
import { Command } from 'commander/esm.mjs';
import envinfo     from 'envinfo';
import fs          from 'fs-extra';
import inquirer    from 'inquirer';
import os          from 'os';
import path        from 'path';

const __dirname   = path.resolve(),
      cwd         = process.cwd(),
      requireJson = path => JSON.parse(fs.readFileSync((path))),
      packageJson = requireJson(path.join(__dirname, 'package.json')),
      insideNeo   = packageJson.name === 'neo.mjs',
      program     = new Command(),
      programName = `${packageJson.name} create-class`,
      questions   = [];

program
    .name(programName)
    .version(packageJson.version)
    .option('-i, --info',              'print environment debug info')
    .option('-b, --baseClass <value>')
    .option('-c, --className <value>')
    .allowUnknownOption()
    .on('--help', () => {
        console.log('\nIn case you have any issues, please create a ticket here:');
        console.log(chalk.cyan(process.env.npm_package_bugs_url));
    })
    .parse(process.argv);

const programOpts = program.opts();

if (programOpts.info) {
    console.log(chalk.bold('\nEnvironment Info:'));
    console.log(`\n  current version of ${packageJson.name}: ${packageJson.version}`);
    console.log(`  running from ${__dirname}`);

    envinfo
        .run({
            System     : ['OS', 'CPU'],
            Binaries   : ['Node', 'npm', 'Yarn'],
            Browsers   : ['Chrome', 'Edge', 'Firefox', 'Safari'],
            npmPackages: ['neo.mjs']
        }, {
            duplicates  : true,
            showNotFound: true
        })
        .then(console.log);
} else {
    console.log(chalk.green(programName));

    if (!programOpts.className) {
        questions.push({
            type   : 'input',
            name   : 'className',
            message: 'Please choose the namespace for your class:',
            default: 'Covid.view.HeaderContainerController'
        });
    }

    if (!programOpts.baseClass) {
        questions.push({
            type   : 'list',
            name   : 'baseClass',
            message: 'Please pick the base class, which you want to extend:',
            choices: ['component.Base', 'container.Base', 'controller.Component', 'core.Base'],
            default: 'container.Base'
        });
    }

    inquirer.prompt(questions).then(answers => {
        let baseClass = programOpts.baseClass || answers.baseClass,
            className = programOpts.className || answers.className,
            startDate = new Date(),
            classFolder, file, folderDelta, index, ns, root, rootLowerCase, viewFile;

        if (className.endsWith('.mjs')) {
            className = className.slice(0, -4);
        }

        ns            = className.split('.');
        file          = ns.pop();
        root          = ns.shift();
        rootLowerCase = root.toLowerCase();

        if (root === 'Neo') {
            console.log('todo: create the file inside the src folder');
        } else {
            if (fs.existsSync(path.resolve(cwd, 'apps', rootLowerCase))) {
                classFolder = path.resolve(cwd, 'apps', rootLowerCase, ns.join('/'));
                folderDelta = ns.length + 2;

                fs.mkdirpSync(classFolder);

                fs.writeFileSync(path.join(classFolder, file + '.mjs'), createContent({baseClass, className, file, folderDelta, ns, root}));

                if (baseClass === 'controller.Component') {
                    index = file.indexOf('Controller');

                    if (index > 0) {
                        viewFile = path.join(classFolder, file.substr(0, index) + '.mjs');

                        if (fs.existsSync(viewFile)) {
                            adjustView({file, viewFile});
                        }
                    }
                }
            } else {
                console.log('\nNon existing neo app name:', chalk.red(root));
                process.exit(1);
            }
        }

        const processTime = (Math.round((new Date - startDate) * 100) / 100000).toFixed(2);
        console.log(`\nTotal time for ${programName}: ${processTime}s`);

        process.exit();
    });

    /**
     * Adds a comma to the last element of the contentArray
     * @param {String[]} contentArray
     * @returns {String[]}
     */
    function addComma(contentArray) {
        contentArray[contentArray.length - 1] += ',';
        return contentArray;
    }

    /**
     * Adjusts the views related to controller.Component or model.Component
     * @param {Object} opts
     * @param {String} opts.file
     * @param {String} opts.viewFile
     */
    function adjustView(opts) {
        let file            = opts.file,
            viewFile        = opts.viewFile,
            content         = fs.readFileSync(viewFile).toString().split(os.EOL),
            fromMaxPosition = 0,
            i               = 0,
            len             = content.length,
            adjustSpaces, codeLine, fromPosition, importLength, importName, j, spaces;

        // find the index where we want to insert our import statement
        for (; i < len; i++) {
            codeLine = content[i];

            if (codeLine === '') {
                break;
            }

            importName   = codeLine.substr(7);
            importName   = importName.substr(0, importName.indexOf(' '));
            importLength = importName.length;

            if (importName > file) {
                break;
            }
        }

        content.splice(i, 0, `import ${file} from './${file}.mjs';`);

        // find the longest import module name
        for (i=0; i < len; i++) {
            codeLine = content[i];

            if (codeLine === '') {
                break;
            }

            fromMaxPosition = Math.max(fromMaxPosition, codeLine.indexOf('from'));
        }

        // adjust the block-formatting for imports
        for (i=0; i < len; i++) {
            codeLine = content[i];

            if (codeLine === '') {
                break;
            }

            fromPosition = codeLine.indexOf('from');
            adjustSpaces = fromMaxPosition - fromPosition;

            if (adjustSpaces > 0) {
                spaces = '';

                for (j=0; j < adjustSpaces; j++) {
                    spaces += ' ';
                }

                content[i] = codeLine.substr(0, fromPosition) + spaces + codeLine.substr(fromPosition);
            }
        }

        fs.writeFileSync(viewFile, content.join(os.EOL));

        console.log(i, opts.file);
        console.log(content);
    }

    /**
     * Creates the content of the neo-class .mjs file
     * @param {Object} opts
     * @param {String} opts.baseClass
     * @param {String} opts.className
     * @param {String} opts.file
     * @param {String} opts.folderDelta
     * @param {String} opts.ns
     * @param {String} opts.root
     * @returns {String}
     */
    function createContent(opts) {
        let baseClass    = opts.baseClass,
            baseClassNs  = baseClass.split('.'),
            baseFileName = baseClassNs.pop(),
            className    = opts.className,
            file         = opts.file,
            i            = 0,
            importDelta  = '';

        for (; i < opts.folderDelta; i++) {
            importDelta += '../';
        }

        let classContent = [
            `import ${baseFileName} from '${importDelta}${(insideNeo ? '' : 'node_modules/neo.mjs/')}src/${baseClassNs.join('/')}/${baseFileName}.mjs';`,
            "",
            "/**",
            ` * @class ${className}`,
            ` * @extends Neo.${baseClass}`,
            " */",
            `class ${file} extends ${baseFileName} {`,
            "    static getConfig() {return {",
            "        /*",
            `         * @member {String} className='${className}'`,
            "         * @protected",
            "         */",
            `        className: '${className}'`
        ];

        baseClass === 'container.Base' && addComma(classContent).push(
            "        /*",
            "         * @member {Object[]} items",
            "         */",
            "        items: []"
        );

        baseClass === 'component.Base' && addComma(classContent).push(
            "        /*",
            "         * @member {Object} _vdom",
            "         */",
            "        _vdom:",
            "        {}"
        );

        classContent.push(
            "    }}",
            "}",
            "",
            `Neo.applyClassConfig(${file});`,
            "",
            `export default ${file};`,
            ""
        );

        return classContent.join(os.EOL);
    }
}