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
        let m = Process.getModuleByName("libexec.so");
        let base = m.base;
        let name = Process.getModuleByAddress(start_routine).name;
        let so_path = Process.findModuleByAddress(start_routine).path;
        let rva = start_routine.sub(base);
        if (name == m.name) {
            console.log("patched pthread_create from", so_path, "rva", rva);
            return 0;
        }
        return org_pthread_create(thread, attr, start_routine, arg);
    }, "int", ["pointer", "pointer", "pointer", "pointer"]);
    Interceptor.replace(pthread_create, my_pthread_create);
}

