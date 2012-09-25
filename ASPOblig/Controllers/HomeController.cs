using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace ASPOblig.Controllers
{
    public class HomeController : Controller
    {
        //
        // GET: /
        
        public ActionResult Index()
        {
            if (Session["login"] != null)
            {
                return RedirectToAction("Index", "Chat");
            }
            else
            {
                return View();
            }
        }

        [AcceptVerbs(HttpVerbs.Post)]
        public ActionResult Index(string username, string password)
        {
            if (username == "bjarne")
            {
                Session["login"] = true;
                return RedirectToAction("Index", "Chat");
            }
            else
            {
                return View();
            }
        }
    }
}
