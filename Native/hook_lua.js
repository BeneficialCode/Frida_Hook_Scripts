var hook_lua = false;

// 确定hook时机
function prepare_hook_lua(){
    android_dlopen_ext = Module.findExportByName(null, "android_dlopen_ext");
    Interceptor.attach(android_dlopen_ext, {
        onEnter: function(args) {
            var name = args[0].readCString();
            if(name.indexOf("libgame.so")!=-1) {
                console.log("android_dlopen_ext:", name);
                hook_lua = true;
            }
        },
        onLeave: function(retval){

        }
    });
}

function get_file_size(fd){
    var buf = Memory.alloc(500);
    var ptr_fstat = Module.findExportByName('libc.so', 'fstat');
    var fstat = new NativeFunction(ptr_fstat, 'int', ['int', 'pointer']);
    if(fd > 0) {
        var ret = fstat(fd, buf);
        if(ret < 0) { 
            console.log('[+] fstat --> failed [!]');
        }
    }
    var size = Memory.readS32(buf.add(0x30));
    if(size > 0) {
        return size;
    } else {
        return 0;
    }
}

function dump_file(file_path,data,datalen){
    send("dump  : "+ file_path);
    var dumpfile = new File(file_path,"wb+");
    dumpfile.write(data.readByteArray(datalen));
    dumpfile.close();
}

function read_lua(filePath){
    var ptr_open = Module.findExportByName("libc.so","open");
    const open = new NativeFunction(ptr_open,'int',['pointer','int']);

    var ptr_read = Module.findExportByName("libc.so","read");
    const read = new NativeFunction(ptr_read,'int',['int','pointer','int']);

    var ptr_close = Module.findExportByName("libc.so","close");
    const close = new NativeFunction(ptr_close,'int',['int']);

    var fd = open(Memory.allocUtf8String(filePath),0);
    var size = get_file_size(fd);
    if(size >0){
        var data = malloc_buf(size + 5);
        if( read(fd,ptr(data),size) <0){
            console.log('[+] Unable to read data [!]');
            close(fd);
            return 0;
        }
        close(fd);
        return {data:data,size:size};
    }

}

function malloc_buf(size){
    var ptr_malloc = Module.findExportByName("libc.so","malloc");
    const malloc = new NativeFunction(ptr(ptr_malloc),'int',['int']);
    var ret_val = malloc(size)
    return ret_val;
}

function folder_mkdirs(p){
    var p_list = p.split("/");
    var pp = "";
    for(var i = 0;i< p_list.length  ;i++){
        pp = pp + "/" + p_list[i];
        if(access(pp) != 0){
            var x = mkdir(pp);
            send("mkdir :"+pp+" ret :" +x);
        }
    }
}

function hook_dlopen() {
    var dlopen = Module.findExportByName(null, "dlopen");
    Interceptor.attach(dlopen, {
            onEnter: function(args){
                if(args[0].readCString().indexOf("libgame.so")!= -1){
                    console.log("dlopen :[" + args[0].readCString()+"]")
                    hook_lua=true
                }
            },
            onLeave:function(retval) {
                if(hook_lua){
                    Interceptor.attach(Module.getBaseAddress("libgame.so").add(0x5624DC),{
                        onEnter: function(args){
                            var obj = {}
                            var name = Memory.readUtf8String(args[3])
                            this.Path  = name.substring(0,name.lastIndexOf("/"));
                            this.file = name.substring(name.lastIndexOf("/"));
                            var dumpDir = "/sdcard/dumpzlua/"+this.Path
                            console.log("dumpDir: "+dumpDir);

                            if (access(dumpDir) == -1){
                                folder_mkdirs(dumpDir)
                            }

                            if (access(dumpDir+"/"+this.file) != 0){
                                dump_file(dumpDir+"/"+this.file , args[1] , args[2].toInt32());
                                console.log("file: " + dumpDir+this.file);
                            }
                            else{
                                var data = read_lua(dumpDir+"/"+this.file);
                                send(data);
                                args[1] = ptr(data.data);
                                args[2] = new NativePointer(ptr(data.size));
                                send("do load file :" + name);
                            }

                        },
                        onLeave: function(retval){

                        }
                    })

                }
            }
        }
    )
}

function mkdir(Path){
    var ptr_mkdir = Module.findExportByName("libc.so","mkdir");
    var mkdir = new NativeFunction(ptr_mkdir,'int',['pointer','int']);
    var ptr_filepath = Memory.allocUtf8String(Path);
    var ret = mkdir(ptr_filepath,777);
    return ret;
}

function arraybuffer2hexstr(buffer)
{
    var hexArr = Array.prototype.map.call(
      new Uint8Array(buffer),
      function (bit) {
        return ('00' + bit.toString(16)).slice(-2)
      }
    )
    return hexArr.join(' ');
}

function access(filePath){
    var ptr_access = Module.findExportByName("libc.so","access");
    var access = new NativeFunction(ptr(ptr_access),'int',['pointer','int']);
    var ptr_filepath = Memory.allocUtf8String(filePath);
    var ret = access(ptr_filepath,0);
    return ret;
}