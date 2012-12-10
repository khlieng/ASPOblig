using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using ASPOblig.Models;

namespace ASPOblig.Controllers
{
    public class HomeController : Controller
    {
        private static DataClassesDataContext db = new DataClassesDataContext();

        
        // Bruke som innloggings delen
        //
        // GET: /
        //sesion brukes for og holde sesesjonen når man er logget inn
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

        //brukes for innlogging av bruker
        [AcceptVerbs(HttpVerbs.Post)]
        public ActionResult Index(string username, string password)
        {
            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
            {
                return View();
            }

            if (db.Users.Where(u => u.nick == username).Count() < 1)
            {
                db.Users.InsertOnSubmit(new User { nick = username, password = password });
                db.SubmitChanges();
            }

            if (db.Users.Where(u => u.nick == username && u.password == password).Count() > 0)
            {
                Session["login"] = true;
                Session["nick"] = username;
                Session["userid"] = db.Users.Where(u => u.nick == username).First().id;
                Session["type"] = db.Users.Where(u => u.nick == username).First().type;

                return RedirectToAction("Index", "Chat");
            }
            else
            {
                ViewBag.ErrorMessage = "Nicket er ikke tilgjengelig!";
                return View();
            }            
        }
    }

    
}
