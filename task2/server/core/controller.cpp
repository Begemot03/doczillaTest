#include "controller.hpp"

std::list<std::unordered_map<std::string, std::string>> StudentController::getAllStudents(Database& db)
{
    std::string sql = "select * from students;";

    bool er = db.exec(sql);

    return Database::getResults();
}

std::unordered_map<std::string, std::string> StudentController::getStudent(Database& db, int id)
{
    std::string sql = "select * from students where id=" + std::to_string(id) + ";";

    bool er = db.exec(sql);

    return Database::getResults().front();
}

bool StudentController::deleteStudent(Database& db, int id)
{
    std::string sql = "delete from students where id=" + std::to_string(id) + ";";

    bool er = db.exec(sql);

    return er;
}

bool StudentController::insertStudent(Database& db, const crow::json::rvalue& json_data)
{
    std::string sql = "insert into students(name, surname, patronymic, birthday, studentGroup) values (";

    std::string name = json_data["name"].s();
    std::string surname = json_data["surname"].s();
    std::string patronymic = json_data["patronymic"].s();
    std::string birthday = json_data["birthday"].s();
    std::string group = json_data["group"].s();

    sql += "'" + name + "','" + surname + "','" + patronymic + "','" + birthday + "','" + group + "');";

    bool er = db.exec(sql);

    return er;
}