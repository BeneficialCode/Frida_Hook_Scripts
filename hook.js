import {hook_dlopen,hook_pthread_create,patch_pthread_create} from "./Native/bypass_ijiami.js";


function main() {
    console.log("hook.js main()...")
    patch_pthread_create();
}



setImmediate(main);

