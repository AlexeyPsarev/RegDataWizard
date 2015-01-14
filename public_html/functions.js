function add(parent, template, isParameter)
{
    var ch = document.createElement("div");
    if (isParameter)
        ch.className = "row";
    else
        ch.className = "row top-pad";
    ch.innerHTML = template;
    parent.insertBefore(ch, parent.lastElementChild);
    return ch;
}

function addEq(parent, template)
{
    var el = add(parent, template, false);
    setEqFldsNames(el);
    setRules();
}

function addCmd(parent, template)
{
    var el = add(parent, template, false);
    setMsgFldsNames(el, "cmd");
    setRules();
}

function addNotif(parent, template)
{
    var el = add(parent, template, false);
    setMsgFldsNames(el, "notif");
    setRules();
}

function addParam(parent, template)
{
    var el = add(parent, template, true);
    setParamName($(el).find(".param-fld")[0]);
    setRules();
}

function setParamName(item)
{
    item.name = "param" + (setParamName.i++).toString();  
};

setParamName.i = 0;

function setEqFldsNames(item)
{
    var i = $(".panel:visible").length;
    var flds = $(item).last().find("input");
    flds[0].name = "eq-code" + i.toString();
    flds[1].name = "eq-name" + i.toString();
    flds[2].name = "eq-type" + i.toString();
}

function setMsgFldsNames(item, msgType)
{
    var i = $(".panel:visible").length;
    var flds = $(item).last().find("input[class*='msg-fld']");
    flds[0].name = msgType + "-intent" + i.toString();
    flds[1].name = msgType + "-name" + i.toString();
}

function del(elem)
{
    elem.parentNode.removeChild(elem);
    generateRegData();
}

function generateGUID()
{
    var s = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
    var res = s.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    }).toUpperCase();
    return res;
}

function setDevID()
{
    $("#d_id").val(generateGUID());
}

function setRules()
{
    $("input:text").on("input", function(){generateRegData();});
    $("select").on("change", function(){generateRegData();});
}

function createValidator()
{
    var validator = $("form").validate({ignore: []});
    
    $.validator.addClassRules({
      req: {
        required: true
      },
      isnum: {
        number: true  
      },
      isintent: {
        range: [256, 65536]
      },
      maxlen: {
        maxlength: 64
      }
      
    });
    
    $.extend($.validator.messages, {
        required: "Value is required",
        number: "Please enter a number",
        range: "Please enter a value between 256 and 65536",
        maxlength: "Please enter no more than 64 characters"
    });

    return validator;
}

function validateEl(validator, el)
{
    if (!validator.element($(el)))
    {
        $(el).addClass("bg-danger");
        return false;
    }
    else
    {
        $(el).removeClass("bg-danger");
        return true;
    }
}

function  generateRegData()
{
    var str = "\"{\"\n";
    var validator = createValidator();
    
    if (!validateEl(validator, $("#d_id")))
    {
        $("textarea").addClass("bg-danger");
        return;
    }
    str += "  \"id:'" + $("#d_id").val() + "',\"\n";
    if (!validateEl(validator, $("#d_key")))
    {
        $("textarea").addClass("bg-danger");
        return;
    }  
    str += "  \"key:'" + $("#d_key").val() + "',\"\n";
    if (!validateEl(validator, $("#d_name")))
    {
        $("textarea").addClass("bg-danger");
        return;
    }  
    str += "  \"name:'" + $("#d_name").val() + "',\"\n";
    
    str += "  \"deviceClass:{\"\n";
    if (!validateEl(validator, $("#dc_name")))
    {
        $("textarea").addClass("bg-danger");
        return;
    }  
    str += "      \"name:'" + $("#dc_name").val() + "',\"\n";
    if (!validateEl(validator, $("#dc_version")))
    {
        $("textarea").addClass("bg-danger");
        return;
    }  
    str += "      \"version:'" + $("#dc_version").val() + "'}";
    
    var eqUnits = $("#eq-container").children();
    if (eqUnits.length > 1) // one child is button "add equipment"
        str += ",\"\n  \"equipment:[";
    // if device has several equipment inuts
    if (eqUnits.length > 2) // one child is button "add equipment"
            str += "\"\n      \"";
    var i;
    for (i = 0;
         i < eqUnits.length - 1; // last child is button "add equipment"
         ++i)
    {        
        str += "{";
        var fields = $(eqUnits[i]).find("input");
        if (!validateEl(validator, fields[0]))
        {
            $("textarea").addClass("bg-danger");
            return;
        }  
        str += "code:'" + fields[0].value + "',";
        //debugger;
        if (!validateEl(validator, fields[1]))
        {
            $("textarea").addClass("bg-danger");
            return;
        }
        str += "name:'" + fields[1].value + "',";
        if (!validateEl(validator, fields[2]))
        {
            $("textarea").addClass("bg-danger");
            return;
        }
        str += "type:'" + fields[2].value + "'}";
        if (i == eqUnits.length - 2) // last element
        {
            if (eqUnits.length > 2)
                str += "\"\n  \"]";
            else
                str += "]";
        }
        else
            str += ",\"\n      \"";
    }

    var isValid = true;
    var cmds = genDataWithParams(validator, "commands", "cmd-container", "cparams", isValid);
    if (!isValid)
    {
        $("textarea").addClass("bg-danger");
        return;
    }
    if (cmds !== "")
        str +=  ",\"\n" + cmds;
    var notifs = genDataWithParams(validator, "notifications", "notif-container", "nparams", isValid);
    if (!isValid)
    {
        $("textarea").addClass("bg-danger");
        return;
    }
    if (notifs !== "")
        str +=  ",\"\n" + notifs;
    if (cmds === "" && notifs === "")
        str += "\"";
    str += "\n\"}\"";
    $("textarea").removeClass("bg-danger");
    $("textarea").val(str);
}

function genDataWithParams(validator, dataItem, dataID, paramID, isValid)
{
    var items = document.getElementById(dataID).children;
    if (items.length <= 1)
    {
        isValid = true;
        return "";
    }
    result = "  \"" + dataItem + ":[\"\n";
    for (var i = 0;
         i < items.length - 1; // one child is button "add command/notification"
         ++i)
    {
        result += "      \"{";
        var fields = items[i].getElementsByTagName("input");
        if (!validateEl(validator, fields[0]))
        {
            $("textarea").addClass("bg-danger");
            isValid = false;
            return "";
        } 
        result += "intent:" + fields[0].value + ",";
        if (!validateEl(validator, fields[1]))
        {
            $("textarea").addClass("bg-danger");
            isValid = false;
            return "";
        } 
        result += "name:'" + fields[1].value + "'";        
        var params = items[i].getElementsByClassName(paramID)[0].children;
        if (params.length > 1)
            result += ",params:";
        if (params.length > 2) // one child is button "add parameter"
            result += "{";
        for (var j = 0;
             j < params.length -1 ; // last child is button "add parameter"
             ++j)
        {
            var pType;
            if (!validateEl(validator, params[j].children[0].children[1]))
            {
                $("textarea").addClass("bg-danger");
                isValid = false;
                return;
            } 
            switch (params[j].children[0].children[0].value)
            {
                case "bool":
                    pType = "bool";
                    break;
                case "uint8":
                    pType = "u8";
                    break;
                case "int8":
                    pType = "i8";
                    break;
                case "uint16":
                    pType = "u16";
                    break;
                case "int16":
                    pType = "i16";
                    break;
                case "uint32":
                    pType = "u32";
                    break;
                case "int32":
                    pType = "i32";
                    break;
                case "uint64":
                    pType = "u64";
                    break;
                case "int64":
                    pType = "i64";
                    break;
                case "single":
                    pType = "f";
                    break;
                case "double":
                    pType = "ff";
                    break;
                case "guid":
                    pType = "uuid";
                    break;
                case "string":
                    pType = "s";
                    break;
                case "binary":
                    pType = "b";
                    break;
            }
            result += params[j].children[0].children[1].value + ":" + pType;
            if (j < params.length - 2)  //parameter is not last
                result += ",";
        }
        if (params.length > 2) // one child is button "add parameter"
            result += "}";
        if (i == items.length - 2) // last item
        {
            result += "}\"\n";
            result += "  \"]\"";
        }
        else
            result += "},\"\n";
    }
    return result;
}

var equipment ='<div class="panel panel-default"> \
                    <div class="panel-heading clearfix"> \
                        <button type="button" class="close" aria-label="Close" \
                            onclick="del(this.parentNode.parentNode.parentNode)">&times</button> \
                    </div> \
                    <div class="panel-body"> \
                        <div class="row"> \
                            <div class="col-md-4 tab"> \
                                <label class="right-pad">code</label> \
                                <input type="text" class="req"> \
                            </div> \
                            <div class="col-md-4 tab"> \
                                <label class="right-pad">name</label> \
                                <input type="text" class="req"> \
                            </div> \
                            <div class="col-md-4 tab"> \
                                <label class="right-pad">type</label> \
                                <input type="text" class="req">  \
                            </div> \
                        </div> <!-- row --> \
                    </div> <!-- panel body --> \
                </div> <!-- panel -->';

var commands = '<div class="panel panel-default"> \
                    <div class="panel-heading clearfix"> \
                        <button type="button" class="close" aria-label="Close" \
                            onclick="del(this.parentNode.parentNode.parentNode)">&times</button> \
                    </div> \
                    <div class="panel-body"> \
                        <div class="row"> \
                            <div class="col-md-3 tab align-c"> \
                                <label class="right-pad">intent</label>  \
                                <input type="text" class="short-text req isnum isintent msg-fld"> \
                            </div> \
                            <div class="col-md-4 tab align-c"> \
                                <label class="right-pad">name</label> \
                                <input type="text" class="req msg-fld"> \
                            </div> \
                            <div class="col-md-5 tab align-c"> \
                                <div class="row"> \
                                    <div class="col-md-2"> \
                                        <label style="float: left">parameters</label> \
                                    </div> \
                                    <div class="col-md-10 cparams"> \
                                        <div class="row top-pad"> \
                                            <div class="col-md-4 col-lg-offset-6"> \
                                                <input type="button" class="btn btn-sm btn-block btn-success" value="Add parameter" \
                                                    onclick="addParam(this.parentNode.parentNode.parentNode, params)"> \
                                            </div> \
                                        </div> \
                                    </div> \
                                </div> \
                            </div> \
                        </div> <!-- row --> \
                    </div> <!-- panel body --> \
                </div> <!-- panel -->';

var params =    '<div class="col-md-12"> \
                    <select size="1"> \
                        <option>bool</option>  \
                        <option selected>uint8</option>  \
                        <option>int8</option>  \
                        <option>uint16</option>  \
                        <option>int16</option>  \
                        <option>uint32</option>  \
                        <option>int32</option>  \
                        <option>uint64</option>  \
                        <option>int64</option>  \
                        <option>single</option>  \
                        <option>double</option>  \
                        <option>guid</option>  \
                        <option>string</option>  \
                        <option>binary</option>  \
                    </select>  \
                    <input type="text" class="req param-fld"> \
                    <button type="button" class="close" aria-label="Close" \
                        onclick="del(this.parentNode)">&times</button> \
                </div>';

var notifications ='<div class="panel panel-default"> \
                        <div class="panel-heading clearfix"> \
                            <button type="button" class="close" aria-label="Close" \
                                onclick="del(this.parentNode.parentNode.parentNode)">&times</button> \
                        </div> \
                        <div class="panel-body"> \
                            <div class="row"> \
                                <div class="col-md-3 tab align-c"> \
                                    <label class="right-pad">intent</label>  \
                                    <input type="text" class="short-text  req isnum isintent msg-fld"> \
                                </div> \
                                <div class="col-md-4 tab align-c"> \
                                    <label class="right-pad">name</label> \
                                    <input type="text" class="req msg-fld"> \
                                     </div> \
                                <div class="col-md-5 tab align-c"> \
                                    <div class="row"> \
                                        <div class="col-md-2"> \
                                            <label style="float: left">parameters</label> \
                                        </div> \
                                        <div class="col-md-10 nparams"> \
                                            <div class="row top-pad"> \
                                                <div class="col-md-4 col-lg-offset-6"> \
                                                    <input type="button" class="btn btn-sm btn-block btn-success" value="Add parameter" \
                                                        onclick="addParam(this.parentNode.parentNode.parentNode, params)"> \
                                                </div> \
                                            </div> \
                                        </div> \
                                    </div> \
                                </div> \
                            </div> <!-- row --> \
                        </div> <!-- panel body --> \
                    </div> <!-- panel -->';
