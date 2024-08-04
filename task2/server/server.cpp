#include <stdio.h>
#include "core/database.hpp"
#include "core/controller.hpp"
#include "crow.h"
#include "crow/middlewares/cors.h"

int main(int argc, char** argv) 
{
    const char* dbName = "server.db";
    Database db;

    if(db.open(dbName))
    {
        std::cout << "Database is opened" << std::endl;
    }
    else
    {
        std::cout << "ERROR on open database" << std::endl;
    }

    // std::string sqlDelete = "drop table students";
    
    // std::string sqlCreateTable =    "create table students (" \
    //                                 "id             integer primary key     not null," \
    //                                 "name           text                    not null," \
    //                                 "surname        text                    not null," \
    //                                 "patronymic     text                    not null," \
    //                                 "birthday       text                    not null," \
    //                                 "studentGroup   text                    not null);";
    
    // std::string sqlInsert = "insert into students(name, surname, patronymic, birthday, studentGroup) values" \
    //                         "('Andrew', 'Petrov', 'Vladimirovich', '2003-10-14', '4311-22');";

    
    // std::string sqlSelect = "select * from students;";


    // if(db.exec(sqlDelete)) std::cout << "Таблица удалена" << std::endl;
    // if(db.exec(sqlCreateTable)) std::cout << "Таблица создана" << std::endl;
    // if(db.exec(sqlInsert)) std::cout << "Данные вставлены" << std::endl;
    // if(db.exec(sqlSelect)) std::cout << "Данные получены" << std::endl;

    // const auto& s = Database::getResults();

    // for(const auto& r : s)
    // {
    //     for(const auto& n : r)
    //     {
    //         std::cout << n.first << " = " << n.second << std::endl;
    //     }
    // }


    crow::App<crow::CORSHandler> app;

    auto& cors = app.get_middleware<crow::CORSHandler>();

    cors
        .global()
            .headers("Content-Type", "X-Custom-Header", "Upgrade-Insecure-Requests")
            .methods("POST"_method, "GET"_method)
        .prefix("/cors")
            .origin("*")
        .prefix("/nocors")
            .ignore();

    CROW_ROUTE(app, "/student").methods(crow::HTTPMethod::GET)([&db]()
    {
        const auto& students = StudentController::getAllStudents(db);

        crow::json::wvalue::list tt;
        
        for(const auto& row : students)
        {
            crow::json::wvalue t;

            for(const auto& v : row)
            {
                t[v.first] = v.second;
            }

            tt.push_back(t);
        }

        crow::json::wvalue o = tt;

        return crow::response(200, o);
    });

    CROW_ROUTE(app, "/student/<int>").methods(crow::HTTPMethod::GET)([&db](int id)
    {
        auto student = StudentController::getStudent(db, id);

        crow::json::wvalue o;
        
        for(const auto& v : student)
        {
            o[v.first] = v.second;
        }

        return crow::response(200, o);
    });

    CROW_ROUTE(app, "/student/<int>").methods(crow::HTTPMethod::POST)([&db](int id)
    {
        auto ok = StudentController::deleteStudent(db, id);

        crow::json::wvalue o = { { "ok", ok } };

        if(ok) return crow::response(200, o);
        else return crow::response(500, o);
    });

    CROW_ROUTE(app, "/student").methods(crow::HTTPMethod::POST)([&db](const crow::request& req)
    {
        auto json_data = crow::json::load(req.body);

        if(!json_data)
        {
            crow::json::wvalue o = { { "ok", false } , { "error", "format json" }};
            return crow::response(400, o);
        }

        std::string name = json_data["name"].s();
        std::string surname = json_data["surname"].s();
        std::string patronymic = json_data["patronymic"].s();
        std::string birthday = json_data["birthday"].s();
        std::string group = json_data["group"].s();

        if (name.empty() || surname.empty() || patronymic.empty() || birthday.empty() || group.empty())
        {
            crow::json::wvalue o = { { "ok", false } , { "error", "empty json" }};
            return crow::response(400, o);
        }

        auto ok = StudentController::insertStudent(db, json_data);

        crow::json::wvalue o = { { "ok", ok } };

        if(ok) return crow::response(200, o);
        else return crow::response(500, o);
    });

    app.port(18080).multithreaded().run();

    db.close();
}