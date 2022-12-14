# kizz

"Keep-It-Zimple-Ztupid" is a simple backend framework for Node.js.

**Still under active development. Use at your own risk.**

- [Example](#example)
- [Dependency Injection](#dependency-injection)
  - [@Injectable](#injectable) 
  - [@Inject](#inject) 
- [Decorators](#decorators)
  - [@Path](#path)
  - [@RouteMethods](#routemethods-get-put-post-delete)
  - [@ValidationPipeline](#validationpipeline)

## Example

```typescript
import * as Core from 'kizz';
import connectToDatabase from './db';

connectToDatabase()
        .then(async () => {
                const app = new Core.Application();
                const server = new Core.Server();
                await app.bootstrap();
                return { app, server };
        })
        .then(async ({ server, app }) => {
                await server.listen(app, 8080);
        });
```

## Dependency Injection

### @Injectable

```typescript
import * as Core from 'kizz';
import MyService, { IMyService } from './services/myService';

interface IMyService {
        message: string;
        bar(): void;
}

@Core.Injectable({
        singleton: true, 
        args: [
                'Hello ',
                () => 'world!'
        ]
})
export default class MyService {
    
        message: string;
        
        constructor(first: string, second: string) {
                this.message = first + second;
        }

        bar() {
                console.log(this.message);
        }
}
```

### @Inject

```typescript
import * as Core from 'kizz';
import MyService, { IMyService } from './services/myService';

@Core.Inject({ myservice: MyService })
export default class MyController {
    
        myservice!: IMyService;
        
        foo() {
                this.myservice.bar();
        }
}
```

## Decorators

### @Path

```typescript
import * as Core from 'kizz';

@Core.Path('/foo')
export default FooController {}
```

### @RouteMethods (@Get, @Put, @Post, @Delete)

```typescript
@Core.Path('/foo')
export default class FooController {
    
    @Core.Get()
    bar(ctx: Core.RouteContext<{}, {}>) {
        
    }

    @Core.Post('/:id/bar')
    baz(ctx: Core.RouteContext<{ id: string; }, { foo: string; }>) {
        console.log(ctx.params.id);
        console.log(ctx.body.foo);
        ctx.send(200, { body: { message: 'Hello world!' } });
    }
}
```

### @ValidationPipeline

```typescript
interface ValidationError {
        key: string;
        message: string;
}

function validateBaz(this: { body: { foo?: string; } }): ValidationError[] {
    const errors = [];
    
    if (!this.body.foo) {
        errors.push({
            key: 'foo', 
            message: 'I think you forgot something...'
        })
    }
    
    return errors;
}

@Core.Path('/foo')
export default class FooController {
    
    @Core.ValidationPipeline([validateBaz])
    @Core.Post('/:id/bar')
    baz(ctx: Core.RouteContext<{ id: string; }, { foo: string; }>) {
        console.log(ctx.params.id);
        console.log(ctx.body.foo);
        ctx.send(200, { body: { message: 'Hello world!' } });
    }
}
```
