$("#submit").on("click", async function()
{   
    
    let fname   = $("#fname").val();
    let lname   = $("#lname").val();
    let subject = $("#subject").val();
    
    updateContact("add", fname, lname, subject);
   
    alert("");
});

async function updateContact(action,fname,lname,subject)
{
    let url = `/api/updateContact?action=${action}&firstname=${fname}&lastname=${lname}&subject=${subject}`
    await fetch(url);
}
