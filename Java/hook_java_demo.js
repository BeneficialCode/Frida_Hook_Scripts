function hook_java() {
    Java.perform(
        function () {
            let LoginActivity = Java.use("com.example.androiddemo.Activity.LoginActivity");
                LoginActivity["a"].overload('java.lang.String', 'java.lang.String').implementation = 
                function (str, str2) {
                    console.log('a is called' + ', ' + 'str: ' + str + ', ' + 'str2: ' + str2);
                    let ret = this.a(str, str2);
                    console.log('a ret value is ' + ret);
                    return ret;
                };

            let FridaActivity1 = Java.use("com.example.androiddemo.Activity.FridaActivity1");
            FridaActivity1["b"].implementation = 
            function (str) {
                console.log('b is called' + ', ' + 'str: ' + str);
                // modifiy the str value
                str = "这是第二关的正确密码。";
                let ret = this.b(str);
                console.log('b ret value is ' + ret);
                return ret;
            };
        }
    );
}

// 设置成员变量
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

// hook内部类
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

function hook_mul_function() {
    Java.perform(function () {
        //hook 类的多个函数
        var class_name = "com.example.androiddemo.Activity.FridaActivity4$InnerClasses";
        var InnerClasses = Java.use(class_name);
        var all_methods = InnerClasses.class.getDeclaredMethods();
        for (var i = 0; i < all_methods.length; i++) {
            var method = (all_methods[i]);
            var methodStr = method.toString();
            var substring = methodStr.substr(methodStr.indexOf(class_name) + class_name.length + 1);
            var methodname = substring.substr(0, substring.indexOf("("));
            console.log(methodname);

            InnerClasses[methodname].implementation = function () {
                console.log("hook_mul_function:", this);
                return true;
            }

        }

    });
}

function hook_dyn_dex() {
    Java.perform(function () {
        var FridaActivity5 = Java.use("com.example.androiddemo.Activity.FridaActivity5");
        Java.choose("com.example.androiddemo.Activity.FridaActivity5", {
            onMatch: function (instance) {
                console.log(instance.getDynamicDexCheck().$className);
            }, onComplete: function () {

            }
        });


        //hook 动态加载的dex
        Java.enumerateClassLoaders({
            onMatch: function (loader) {
                try {
                    if (loader.findClass("com.example.androiddemo.Dynamic.DynamicCheck")) {
                        console.log(loader);
                        Java.classFactory.loader = loader;      //切换classloader
                    }
                } catch (error) {

                }

            }, onComplete: function () {

            }
        });

        var DynamicCheck = Java.use("com.example.androiddemo.Dynamic.DynamicCheck");
        console.log(DynamicCheck);
        DynamicCheck.check.implementation = function () {
            console.log("DynamicCheck.check");
            return true;
        }
    });
}

// 枚举class
function hook_mul_class() {
    Java.perform(function () {
        Java.enumerateLoadedClasses({
            onMatch: function (name, handle) {
                if (name.indexOf("com.example.androiddemo.Activity.Frida6") >= 0) {
                    console.log(name);
                    var fridaclass6 = Java.use(name);
                    fridaclass6.check.implementation = function () {
                        console.log("frida 6 check:", this);
                        return true;
                    };
                }

            }, onComplete: function () {

            }
        })
    });
}