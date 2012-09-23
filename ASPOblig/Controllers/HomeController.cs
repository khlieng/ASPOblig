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
            bool login = true;

            if (login)
            {
                return RedirectToAction("Index", "Chat");
            }
            else
            {
                return View();
            }
        }
    }
}
