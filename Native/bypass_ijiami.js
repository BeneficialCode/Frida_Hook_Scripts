// 将加载的so库打印出来,观察是加载了哪个so库后程序退出了
/*
[NX729J::com.ShundeRCB.mobilebank ]-> load /system/framework/oat/arm64/org.apache.http.legacy.odex
load /data/app/~~E7doy6yjcq6-15RxYB9elQ==/com.ShundeRCB.mobilebank-H91It3XzRY7_1v1TTf2XBA==/oat/arm64/base.odex
load /data/user/0/com.ShundeRCB.mobilebank/files/libexec.so
load /data/user/0/com.ShundeRCB.mobilebank/files/libexecmain.so
Process terminated
*/
export function hook_dlopen() {
    Interceptor.attach(Module.findExportByName(null, "android_dlopen_ext"),
        {
            onEnter: function (args) {
                var pathptr = args[0];
                if (pathptr !== undefined && pathptr != null) {
                    var path = ptr(pathptr).readCString();
                    console.log("load " + path);
                }
            }
        }
    );
}

/*
libart.so
libexec.so
libutils.so
libglnubia.so
libcrashsdk.so
libAPSE_8.0.0.so
libdec7zmt-arm6425936580.so
libnllvm1714382482054.so
libface_detect.so
*/
export function hook_pthread_create(){
    var pthread_create = Module.findExportByName(null, "pthread_create");
    Interceptor.attach(pthread_create,
        {
            onEnter: function (args) {
                var module = Process.findModuleByAddress(ptr(this.returnAddress))
                if (module != null) {
                    console.log("[pthread_create] called from", module.name)
                }
                else {
                    console.log("[pthread_create] called from", ptr(this.returnAddress))
                }
            },
        }
    )
}

/*
int pthread_create(pthread_t *restrict thread,
                          const pthread_attr_t *restrict attr,
                          void *(*start_routine)(void *),
                          void *restrict arg);
patch 所有来自libexec.so的pthread_create函数调用
*/
export function patch_pthread_create(){
    let pthread_create = Module.findExportByName(null, "pthread_create");
    let org_pthread_create = new NativeFunction(pthread_create, "int", ["pointer", "pointer", "pointer", "pointer"]);
    let my_pthread_create = new NativeCallback(function (thread, attr, start_routine, arg) {
        let name = Process.getModuleByAddress(start_routine).name;
        let so_path = Process.findModuleByAddress(start_routine).path;
        if (name == "libexec.so") {
            console.log("patched pthread_create from", so_path, "start_routine", start_routine);
            return 0;
        }
        return org_pthread_create(thread, attr, start_routine, arg);
    }, "int", ["pointer", "pointer", "pointer", "pointer"]);
    Interceptor.replace(pthread_create, my_pthread_create);
}

export function hook_file_operation() {
    let fread = Module.findExportByName(null, "fread");
    let fstat = Module.findExportByName(null, "fstat");
    
    // size_t fread(void *ptr, size_t size, size_t nmemb, FILE *stream)
    Interceptor.attach(fread,{
        onEnter: function(args){
            console.log("fread size:", args[1].toInt32());
            console.log("fread nmemb:", args[2].toInt32());
        }
    })
}

export function hook_memcmp() {
    let memcmp = Module.findExportByName(null, "memcmp");

    Interceptor.attach(memcmp, {
        onEnter: function(args) {
            this.buf1 = args[0].readByteArray(args[2].toInt32());
            this.buf2 = args[1].readByteArray(args[2].toInt32());
            this.size = args[2].toInt32();
        },onLeave: function(retval){
            if (retval.toInt32() != 0 && this.size < 32) {
                console.log("memcmp size:", this.size);
                console.log("memcmp buf1:", hexdump(this.buf1, {length: this.size}));
                console.log("memcmp buf2:", hexdump(this.buf2, {length: this.size}));
            }
        }
    });
}

export function hook_memcpy() {
    let memcpy = Module.findExportByName(null, "memcpy");

    Interceptor.attach(memcpy, {
        onEnter: function(args) {
            this.dest = args[0];
            this.src = args[1];
            this.size = args[2].toInt32();
        },onLeave: function(retval){
            if(this.size != 0  && this.size < 32){

            }
        }
    });
}

export function hook_fopen() {
    let fopen = Module.findExportByName(null, "fopen");

    Interceptor.attach(fopen, {
        onEnter: function(args) {
            let path = args[0].readCString();
            let mode = args[1].readCString();
            // console.log("fopen path:", path);
            // console.log("fopen mode:", mode);
        }
    });
}

export function hook_fgets() {
    let fgets = Module.findExportByName(null, "fgets");

    Interceptor.attach(fgets, {
        onEnter: function(args) {
            this.size = args[1].toInt32();
        },onLeave: function(retval){
            if (this.size != 0 && retval != 0) {
                console.log("fgets size:", this.size);
                console.log("fgets buf:", retval.readCString());
            }
        }
    });
}