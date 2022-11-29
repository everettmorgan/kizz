import * as fs from 'node:fs';
import * as path from 'node:path';
import { Injectable, Internal } from './Injection';

@Internal()
@Injectable({
        singleton: true,
        args: [
                `${path.resolve(process.cwd())}/dist/controllers`,
        ],
})
export default class ControllerImporter {
        path: string;

        constructor(filePath: string) {
                this.path = filePath;
        }

        async read() {
                const controllerContents = fs.readdirSync(this.path);

                const controllerFiles = controllerContents.filter(
                        (filename) => filename.endsWith('.js'),
                );

                return Promise.all(
                        controllerFiles.map(
                                async (fileName) => (await import(`${this.path}/${fileName}`)).default,
                        ),
                );
        }
}
