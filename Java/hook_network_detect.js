export function hook_network() {
    Java.perform(function () {
        //TrustAllManager
        var TrustAllManagerClass = Java.registerClass({
            name: "TrustAllManager",
            implements:[Java.use("javax.net.ssl.X509TrustManager")],
            methods: {
                checkClientTrusted(chain, authType) {
                    console.log("checkClientTrusted Called!!")
                },
                checkServerTrusted(chain, authType) {
                    console.log("checkServerTrusted Called!!")
                },
                getAcceptedIssuers() {
                  return [];
                },
              }
        });
        var trustAllManagerHandle = TrustAllManagerClass.$new()

        var sslContext = Java.use("javax.net.ssl.SSLContext").getInstance("TLS")
        var trustManagers = Java.array("Ljavax.net.ssl.X509TrustManager;",[trustAllManagerHandle])
        sslContext.init(null,trustManagers,null)
        var sslSocketFactory = sslContext.getSocketFactory()

        Java.use("okhttp3.OkHttpClient$Builder").sslSocketFactory.overload('javax.net.ssl.SSLSocketFactory', 'javax.net.ssl.X509TrustManager').implementation = function(arg0, arg1){
            console.log("sslSocketFactory Called!!")
            return this.sslSocketFactory(sslSocketFactory,trustAllManagerHandle)
        }

        var MyHostnameVerify = Java.registerClass({
            name: "MyHostnameVerify",
            implements:[Java.use("javax.net.ssl.HostnameVerifier")],
            methods: {
                verify(hostname, session){
                    console.log(hostname)
                    return true
                }
            }
        })
        var myHostnameVerifyHandle = MyHostnameVerify.$new()

        Java.use("okhttp3.OkHttpClient$Builder").build.implementation = function(){
            this.hostnameVerifier(myHostnameVerifyHandle)
            console.log(this.hostnameVerifier)
            return this.build()
        }

        var can_hook = false
        var ConnectivityManager = Java.use("android.net.ConnectivityManager");
        ConnectivityManager.getNetworkInfo.overload('int').implementation = function(){
            console.log("call getNetworkInfo function !!!")
            if(arguments[0] == 17){
                can_hook = true
            }
            var ret = this.getNetworkInfo(arguments[0])
            return ret
        }

        var NetworkInfo = Java.use("android.net.NetworkInfo")
        NetworkInfo.isConnected.implementation = function(){
            var ret = this.isConnected()
            if(can_hook){
                ret = false
                can_hook = false
                console.log("call isConnected function !!!")
            }
            return ret
        }

        var NetworkCapabilities = Java.use("android.net.NetworkCapabilities")
        NetworkCapabilities.hasTransport.implementation = function(){
            var ret = this.hasTransport(arguments[0])
            if(arguments[0] == 4){
                console.log("call hasTransport function !!!")
                ret = false
            }
            return ret
        }

        NetworkCapabilities.transportNameOf.overload('int').implementation = function(){
            console.log("call transportNameOf function !!!")
            var ret = this.transportNameOf(arguments[0])
            if(ret.indexOf("VPN") >= 0){
                ret = "WIFI"
            }
            return ret;
        }


        var NetworkInterface = Java.use("java.net.NetworkInterface")
        NetworkInterface.getAll.implementation = function(){
            var nis = this.getAll()
            console.log("call getAll function !!!")
            nis.forEach(function(ni){
                if (ni.name.value.indexOf("tun0")>=0 || ni.name.value.indexOf("ppp0")>=0 ){
                    ni.name.value = "xxxx"
                    ni.displayName.value = "xxxx"
                }
            })
            return nis
        }

        var CertificatePinner = Java.use("okhttp3.CertificatePinner");
        CertificatePinner["check$okhttp"].implementation = function (hostname, cleanedPeerCertificatesFn) {
            console.log("CertificatePinner.check Called!!")
            return
        };
    })
}