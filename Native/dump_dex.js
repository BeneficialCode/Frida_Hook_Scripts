function get_self_process_name() {
    var addr_open = Module.getExportByName("libc.so", "open");
    var open  = new NativeFunction(addr_open, "int", ["pointer", "int"]);

    var addr_read = Module.getExportByName("libc.so", "read");
    var read = new NativeFunction(addr_read, "int", ["int", "pointer", "int"]);

    var close_addr = Module.getExportByName("libc.so", "close");
    var close = new NativeFunction(close_addr, "int", ["int"]);

    var path = Memory.allocUtf8String("/proc/self/cmdline");
    var fd = open(path, 0);
    if(fd != -1) {
        var buffer = Memory.alloc(256);
        var result = read(fd, buffer, 256);
        close(fd);
        return buffer.readCString();
    }

    return null;
}

function access(filePath){
    var ptr_access = Module.findExportByName("libc.so","access");
    var access = new NativeFunction(ptr(ptr_access),'int',['pointer','int']);
    var ptr_filepath = Memory.allocUtf8String(filePath);
    var ret = access(ptr_filepath,0);
    return ret;
}


function mkdir(path){
    var ptr_mkdir = Module.findExportByName("libc.so","mkdir");
    var mkdir = new NativeFunction(ptr_mkdir,'int',['pointer','int']);
    var ptr_filepath = Memory.allocUtf8String(path);
    var ret = mkdir(ptr_filepath,755);
    return ret;
}

function chmod(path) {
    var p_chmod = Module.getExportByName("libc.so", "chmod");
    var chmod = new NativeFunction(p_chmod, "int", ["pointer", "int"]);

    var path = Memory.allocUtf8String(path);
    var ret = chmod(path, 755);
    return ret;
}


function dump_dex() {
    var libart = Process.findModuleByName("libart.so");
    var p_DefineClass = null;
    var symbols = libart.enumerateSymbols();
    for(var idx = 0;idx < symbols.length;idx++){
        var symbol = symbols[idx];
        var symbol_name = symbol.name;
        // Android 11 
        // art::ClassLinker::DefineClass(art::Thread*, char const*, unsigned long, art::Handle<art::mirror::ClassLoader>, art::DexFile const&, art::dex::ClassDef const&)
        // _ZN3art11ClassLinker11DefineClassEPNS_6ThreadEPKcmNS_6HandleINS_6mirror11ClassLoaderEEERKNS_7DexFileERKNS_3dex8ClassDefE
        // Android 9 art::ClassLinker::DefineClass(art::Thread*, char const*, unsigned long, art::Handle<art::mirror::ClassLoader>, art::DexFile const&, art::DexFile::ClassDef const&)
        // _ZN3art11ClassLinker11DefineClassEPNS_6ThreadEPKcmNS_6HandleINS_6mirror11ClassLoaderEEERKNS_7DexFileERKNS9_8ClassDefE
        if(symbol_name.indexOf("ClassLinker")>=0 && symbol_name.indexOf("DefineClass")>=0 &&
            symbol_name.indexOf("Thread")>=0 && symbol_name.indexOf("DexFile")>=0) {
            console.log(symbol_name,symbol.address);
            p_DefineClass = symbol.address;
        }
    }

    var dex_maps = {};

    if(p_DefineClass){
        Interceptor.attach(p_DefineClass,{
            onEnter: function(args) {
                var dex_file = args[5];
                var base = ptr(dex_file).add(Process.pointerSize).readPointer();
                var size = ptr(dex_file).add(Process.pointerSize*2).readUInt();

                if(dex_maps[base] == undefined) {
                    dex_maps[base] = size;
                    var magic = ptr(base).readCString();
                    if(magic.indexOf("dex") == 0) {
                        var process_name = get_self_process_name();
                        if(process_name != null) {
                            var dex_dir_path = "/data/data/" + process_name + "/files/dump_dex_" + process_name;
                            mkdir(dex_dir_path);
                            var dex_path = dex_dir_path + "/class_" + base + "_" + size + ".dex";
                            console.log("dump dex : " + dex_path);
                            var fd = new File(dex_path, "wb");
                            if(fd){
                                var dex_buffer = ptr(base).readByteArray(size);
                                fd.write(dex_buffer);
                                fd.flush();
                                fd.close();
                            }
                        }
                    }
                }
            },
            onLeave: function(retval) {
            }
        });
    }
}

var is_hook_libart = false;

export function hook_DefineClass() {
    var addr_dlopen = Module.getExportByName(null, "dlopen");
    Interceptor.attach(addr_dlopen, {
        onEnter: function(args) {
            var so_name = args[0].readCString();
            if(so_name.indexOf("libc.so") >= 0) {
                console.log("dlopen libc.so");
                this.can_hook_libart = true;
            }
            console.log("dlopen:", so_name);
        },
        onLeave: function(retval) {
            if(this.can_hook_libart && !is_hook_libart) {
                dump_dex();
                is_hook_libart = true;
            }
        }
    });
}