# Introduction #

Insert switchboard examples here



# Application initialization process #

After all required widgets has been created insert the following string
```
$(document).ready(function() {
    ...
    $(document).trigger("init");
}
```

Here is an example for init switchboard chain:
```
$(document).ready(function() {
    //called by document.trigger("init");
    $.switchboard.add({
        action: 'init',
        widget: {
            id: "document",
            obj: $(document),
            notify: {
                event: "init"
            }
        }
    })
    //request product list from a proxy,
    //proxy should trigger "newProductList":  trigger("newProductList", productList) on complete
    .add({
        action: 'init',
        widget: {
            id: "proxy",
            obj: $("body"),
            update: {
                methodName: "proxy",
                methodParams: function() {
                    return ["getProxyList"];
                }
            }
        }
    })
    //request companyList from proxy,
    //proxy should  trigger "newCompanyList", trigger("newCompanyList", companyList) on complete
    .add({
        action: 'init',
        widget: {
            id: "proxy",
            obj: $("body"),
            update: {
                methodName: "proxy",
                methodParams: function() {
                    return ["getComapnyList"];
                }
            }
        }
    })
    //triggered by proxy event="newProductList"
    .add({
        action: 'newProductList',
        widget: {
            id: "proxy",
            obj: $("body"),
            notify: {
                event: "newProductList",
                setModel: function(data) {
                    return data;
                }
            }
        }
    })
    //triggered by wfs when themeList is recieved
    //will populate jDropDownMenu with values - $("#productMenu").jDropDownMenu(productMenu.list)
    .add({
        action: 'newProductList',
        widget: {
            id: "productMenu",
            obj: $("#productMenu"),
            update: {
                methodName: "jDropDownMenu",
                methodParams: function(themeList) {
                    return ["setup", productMenu.list];
                }
            }
        }
    });
}); //jQuery

```



# Details #

Add your content here.  Format your content with:
  * Text in **bold** or _italic_
  * Headings, paragraphs, and lists
  * Automatic links to other wiki pages