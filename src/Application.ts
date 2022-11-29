import { Inject } from './Injection';
import ApplicationRouter from './Router';
import ControllerImporter from './Importer';

@Inject({
        router: ApplicationRouter,
        importer: ControllerImporter,
})
export class Application {
        readonly router!: ApplicationRouter;

        readonly importer!: ControllerImporter;

        async bootstrap() {
                const constructors = await this.importer.read();

                const controllers = constructors.map(
                        (constructor: any) => new constructor(),
                );

                this.router.bootstrap(controllers);
        }
}
