using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using ASPOblig.Models;

namespace ASPOblig.Controllers
{
    public class UsersController : Controller
    {
        //
        // GET: /User/

        DataClassesDataContext db = new DataClassesDataContext();

        public ActionResult Index()
        {
            List<User> u = db.Users.ToList();
            return View(u);
        }

        //
        // GET: /User/Details/5

        public ActionResult Details(int id)
        {
            User u = (from o in db.Users
                         where o.id == id
                         select o).FirstOrDefault();
            return View(u);
        }

        //
        // GET: /User/Create

        public ActionResult Create()
        {
            return View("Create");
        } 

        //
        // POST: /User/Create

        [HttpPost]
        public ActionResult Create(FormCollection collection)
        {
            User u = new User();
            try
            {
                // TODO: Add insert logic here
                UpdateModel(u);
                db.Users.InsertOnSubmit(u);
                db.SubmitChanges();

                return RedirectToAction("Index");
            }
            catch
            {
                return View();
            }
        }
        
        //
        // GET: /User/Edit/5
 
        public ActionResult Edit(int id)
        {
            User u = (from o in db.Users
                      where o.id == id
                      select o).FirstOrDefault();
            return View(u);
        }

        //
        // POST: /User/Edit/5

        [HttpPost]
        public ActionResult Edit(int id, FormCollection collection)
        {
            User u = (from o in db.Users
                      where o.id == id
                      select o).FirstOrDefault();
            try
            {
                // TODO: Add update logic here
                UpdateModel(u);
                db.SubmitChanges();
                return RedirectToAction("Index");
            }
            catch
            {
                return View();
            }
        }

        //
        // GET: /User/Delete/5
 
        public ActionResult Delete(int id)
        {
            User u = (from o in db.Users
                      where o.id == id
                      select o).FirstOrDefault();
            return View(u);
        }

        //
        // POST: /User/Delete/5

        [HttpPost]
        public ActionResult Delete(int id, FormCollection collection)
        {
            User u = (from o in db.Users
                      where o.id == id
                      select o).FirstOrDefault();
            try
            {
                // TODO: Add delete logic here
                db.Users.DeleteOnSubmit(u);
                db.SubmitChanges();
 
                return RedirectToAction("Index");
            }
            catch
            {
                return View();
            }
        }
    }
}
