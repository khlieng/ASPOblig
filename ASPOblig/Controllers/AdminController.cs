﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace MvcApplication1asdasd.Controllers
{
    public class AdminController : Controller
    {
        public ActionResult Index()
        {
            ViewBag.Message = "AdminShit";

            return View();
        }

        public ActionResult About()
        {
            return View();
        }
    }
}