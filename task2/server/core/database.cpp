#include "database.hpp"

Database::Database() {}

bool Database::open(const char* dbName)
{   
    int rc;

    this->dbName = dbName;

    rc = sqlite3_open(dbName, &(this->db));

    return rc == SQLITE_OK;
}

void Database::close()
{
    if(db)
    {
        this->dbName = "";
        sqlite3_close(this->db);
        this->db = nullptr;
    }
}

bool Database::exec(std::string sql)
{
    int rc;
    char *zErrMsg = 0;

    select.clear();

    rc = sqlite3_exec(this->db, sql.c_str(), Database::callback, nullptr, &zErrMsg);

    return rc == SQLITE_OK;
}

int Database::callback(void *NotUsed, int argc, char **argv, char **azColName)
{
    std::unordered_map<std::string, std::string> v;

    for (int i = 0; i < argc; i++) 
    {
        v[azColName[i]] = argv[i] ? argv[i] : "NULL";
    }

    select.push_back(v);

    return 0;
}

const std::list<std::unordered_map<std::string, std::string>>& Database::getResults() {
    return select;
}

std::list<std::unordered_map<std::string, std::string>> Database::select;