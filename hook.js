import {hook_dlopen,hook_fgets,hook_pthread_create,patch_pthread_create} from "./Native/bypass_ijiami.js";
import {hook_file_operation,hook_memcmp,hook_memcpy} from "./Native/bypass_ijiami.js";
import {hook_okhttp3} from "./Java/hook_okhttp3.js";
import {replace_str} from "./Native/bypass_frida_detect.js";
import {hook_fopen} from "./Native/bypass_ijiami.js";
import {hook_network } from "./Java/hook_network_detect.js";
import { hook_DefineClass } from "./Native/dump_dex.js";


function main() {
    console.log("Hello ijiami!!!");
    //replace_str();
    //hook_memcpy();
    //hook_memcmp();
    //patch_pthread_create();
    //hook_dlopen();
    //hook_pthread_create();
    hook_fopen();
    hook_fgets();
    hook_network();
    hook_DefineClass();
    //hook_okhttp3();
}



setImmediate(main);

