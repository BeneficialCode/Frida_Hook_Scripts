Android Frida Scripts

```
frida-compile hook.js -o hook.o
frida -U -f com.ShundeRCB.mobilebank -l hook.o
```