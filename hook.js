function hook_java() {
    Java.perform(function () {
        let LoginActivity = Java.use("com.example.androiddemo.Activity.LoginActivity");
        LoginActivity["a"].overload('java.lang.String', 'java.lang.String').implementation = function (str, str2) {
        console.log('a is called' + ', ' + 'str: ' + str + ', ' + 'str2: ' + str2);
        let ret = this.a(str, str2);
        console.log('a ret value is ' + ret);
        return ret;
        };

        let FridaActivity1 = Java.use("com.example.androiddemo.Activity.FridaActivity1");
        FridaActivity1["b"].implementation = function (str) {
        console.log('b is called' + ', ' + 'str: ' + str);
        // modifiy the str value
        str = "这是第二关的正确密码。";
        let ret = this.b(str);
        console.log('b ret value is ' + ret);
        return ret;
        };
    });
}


// 主动调用
function call_java(){
    //主动调用函数
    Java.perform(function () {
        var FridaActivity2 = Java.use("com.example.androiddemo.Activity.FridaActivity2");
        FridaActivity2.setStatic_bool_var();    //调用静态函数

        // 调用实例函数
        Java.choose("com.example.androiddemo.Activity.FridaActivity2", {
            onMatch: function (instance) {
                instance.setBool_var();
            },
            onComplete: function () {

            }
        });
    });
}

function set_java_field(){
    Java.perform(function () {
        let FridaActivity3 = Java.use("com.example.androiddemo.Activity.FridaActivity3");
        FridaActivity3.static_bool_var.value = true;

        Java.choose("com.example.androiddemo.Activity.FridaActivity3", {
            onMatch: function (instance) {
                instance.bool_var.value = true;
                // 如果存在函数名和成员变量名相同的情况，需要加上下划线
                instance._same_name_bool_var.value = true;
            },
            onComplete: function () {

            }
        });


    });
}

function hook_inner_class_method(){
    Java.perform(function (){
        let InnerClasses = Java.use("com.example.androiddemo.Activity.FridaActivity4$InnerClasses");
        InnerClasses["check1"].implementation = function () {
            return true;
        };
        InnerClasses["check2"].implementation = function () {
            return true;
        };
        InnerClasses["check3"].implementation = function () {
            return true;
        };
        InnerClasses["check4"].implementation = function () {
            return true;
        };
        InnerClasses["check5"].implementation = function () {
            return true;
        };
        InnerClasses["check6"].implementation = function () {
            return true;
        };
    })
}

function main() {
    hook_okhttp3();
}

function hook_okhttp3() {
    Java.perform(function() {
        let SocketSecureCell = Java.use("com.dianping.nvnetwork.tunnel.Encrypt.SocketSecureCell");
        SocketSecureCell["isSocketConnected"].implementation = function () {
            console.log(`SocketSecureCell.isSocketConnected is called`);
            let result = this["isSocketConnected"]();
            console.log(`SocketSecureCell.isSocketConnected result=${result}`);
            return result;
        };
        var ByteString = Java.use("com.android.okhttp.okio.ByteString");
        var Buffer = Java.use('okio.Buffer');         
        var Interceptor = Java.use("okhttp3.Interceptor");
        var MyInterceptor = Java.registerClass({
            name: "okhttp3.MyInterceptor",
            implements: [Interceptor],
            methods: {
                intercept: function(chain) {
                    var request = chain.request();
                    try {
                        console.log("MyInterceptor.intercept onEnter:", request, "\nrequest headers:\n", request.headers());
                        var requestBody = request.body();
                        var contentLength = requestBody ? requestBody.contentLength() : 0;
                        if (contentLength > 0) {
                            var BufferObj = Buffer.$new();

                            requestBody.writeTo(BufferObj);
                            try {
                                console.log("\nrequest body String:\n", BufferObj.readString(), "\n");
                            } catch (error) {
                                try {
                                    console.log("\nrequest body ByteString:\n", ByteString.of(BufferObj.readByteArray()).hex(), "\n");
                                } catch (error) {
                                    console.log("error 1:", error);
                                }
                            }
                        }
                    } catch (error) {
                        console.log("error 2:", error);
                    }
                    var response = chain.proceed(request);
                    try {
                        console.log("MyInterceptor.intercept onLeave:", response, "\nresponse headers:\n", response.headers());
                        var responseBody = response.body();
                        var contentLength = responseBody ? responseBody.contentLength() : 0;
                        if (contentLength > 0) {
                            console.log("\nresponsecontentLength:", contentLength, "responseBody:", responseBody, "\n");

                            var ContentType = response.headers().get("Content-Type");
                            console.log("ContentType:", ContentType);
                            if (ContentType.indexOf("video") == -1) {
                                if (ContentType.indexOf("application") == 0) {
                                    var source = responseBody.source();
                                    if (ContentType.indexOf("application/zip") != 0) {
                                        try {
                                            console.log("\nresponse.body StringClass\n", source.readUtf8(), "\n");
                                        } catch (error) {
                                            try {
                                                console.log("\nresponse.body ByteString\n", source.readByteString().hex(), "\n");
                                            } catch (error) {
                                                console.log("error 4:", error);
                                            }
                                        }
                                    }
                                }

                            }

                        }

                    } catch (error) {
                        console.log("error 3:", error);
                    }
                    return response;
                }
            }
        });
        var ArrayList = Java.use("java.util.ArrayList");
        var OkHttpClient = Java.use("okhttp3.OkHttpClient");
        console.log(OkHttpClient);
        OkHttpClient.$init.overload('okhttp3.OkHttpClient$Builder').implementation = function(Builder) {
            console.log("OkHttpClient.$init:", this, Java.cast(Builder.interceptors(), ArrayList));
            this.$init(Builder);
        };

        var MyInterceptorObj = MyInterceptor.$new();
        var Builder = Java.use("okhttp3.OkHttpClient$Builder");
        console.log(Builder);
        Builder.build.implementation = function() {
            this.interceptors().clear();
            //var MyInterceptorObj = MyInterceptor.$new();
            this.interceptors().add(MyInterceptorObj);
            var result = this.build();
            return result;
        };

        Builder.addInterceptor.implementation = function(interceptor) {
            this.interceptors().clear();
            //var MyInterceptorObj = MyInterceptor.$new();
            this.interceptors().add(MyInterceptorObj);
            return this;
            //return this.addInterceptor(interceptor);
        };

        console.log("hook_okhttp3...");
    });
}

setImmediate(main);

