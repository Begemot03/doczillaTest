#pragma once
#include <string>
#include <unordered_map>
#include <sqlite3.h>
#include <list>

class Database
{
public:
    Database();

    bool open(const char*);
    void close();

    bool exec(std::string);

    static int callback(void *, int, char **, char **);
    static const std::list<std::unordered_map<std::string, std::string>>& getResults();

private:
    std::string dbName;
    sqlite3 *db;

    static std::list<std::unordered_map<std::string, std::string>> select;
};