#pragma once
#include "crow.h"
#include <list>
#include <string>
#include <unordered_map>
#include "database.hpp"

class StudentController
{
public:
    static std::list<std::unordered_map<std::string, std::string>> getAllStudents(Database&);
    static std::unordered_map<std::string, std::string> getStudent(Database&, int);
    static bool deleteStudent(Database&, int);
    static bool insertStudent(Database&, const crow::json::rvalue&);
};