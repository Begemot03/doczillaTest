#include <iostream>
#include <string>
#include <fstream>
#include <filesystem>
#include <stack>
#include <list>
#include <algorithm>
#include <tuple>
#include <regex>

namespace fs = std::filesystem;

const std::regex requireKeyRegex {"require '(.*)'"};
const std::regex txtFileRegex{".txt"};

// Нода графа файловой системы
struct FileNode
{
    std::string filename;
    std::list<std::shared_ptr<FileNode>> fileRequires;

    bool operator <(FileNode& r) const
    {
        return filename.compare(r.filename) < 0;
    }

    bool operator >(FileNode& r) const
    {
        return filename.compare(r.filename) > 0;
    }

    bool operator== (const FileNode& r) const
    {
        return this->filename == r.filename;
    }

    bool operator!= (const FileNode& r) const
    {
        return this->filename != r.filename;
    }

    FileNode(std::string f) : filename(f) {}
    FileNode(const FileNode& other) = delete;
    FileNode& operator=(const FileNode& other) = delete;
};

class DirectoryGraph
{
public:
    DirectoryGraph(fs::path rootPath) : rootPath(rootPath) {}

    // Загрузить информацию о всех файлах
    void loadDirectory()
    {
        std::stack<fs::path> directories;

        directories.push(this->rootPath);

        while(!directories.empty())
        {
            fs::path curDir = directories.top();
            directories.pop();

            for(auto const& dir : fs::directory_iterator{curDir})
            {
                if(dir.is_directory())
                {
                    directories.push(dir.path());
                }
                else
                {
                    this->files.push_back(std::make_shared<FileNode>(dir.path()));
                }
            }
        }
    }

    // Спарсить все зависимости
    void loadRequires()
    {
        for(auto file : this->files)
        {
            std::ifstream fileText {file->filename};
            std::string line;

            while(getline(fileText, line)) 
            {
                // Проверяем есть ли зависимость в файле
                std::smatch matches;

                bool isMatch = std::regex_search(line, matches, requireKeyRegex);
                
                // Если есть то добавляем ее и проверяем есть ли тип файла, если нет, то добавляем его
                if(isMatch)
                {
                    std::smatch tm;
                    std::string filePath = matches[1].str();
                    std::string filename;

                    bool isHasType = std::regex_search(filePath, tm, txtFileRegex);

                
                    if(isHasType)
                    {
                        filename = filePath;
                    }
                    else
                    {
                        filename = filePath + ".txt";
                    }

                    filename = this->rootPath/filename;

                    for(auto f : this->files)
                    {
                        if(f->filename == filename) 
                        {
                            file->fileRequires.push_back(f);
                            break;
                        }
                    }
                }
            }
        }
    }

    // Поиск цикла в ориентированном графе
    std::tuple<bool, std::list<std::shared_ptr<FileNode>>> hasCycle()
    {
        std::list<std::shared_ptr<FileNode>> visited{};
        std::list<std::shared_ptr<FileNode>> recStack{};

        for(auto file : this->files)
        {
            if(std::find(visited.begin(), visited.end(), file) == visited.end())
            {
                if(hasCycle(file, visited, recStack))
                {
                    return {true, visited};
                }
            }
        }
        
        return {false, visited};
    }

    // Сортирует файлы в порядке возрастания
    void sortFiles()
    {
        files.sort([](auto l, auto r)
        {
            return l->filename < r->filename;
        });
    }

    // Получить список всех зависимостей с учетом вложенности
    std::list<std::shared_ptr<FileNode>> getAllRequires(std::shared_ptr<FileNode> file)
    {
        std::stack<std::shared_ptr<FileNode>> sFiles;
        std::list<std::shared_ptr<FileNode>> result;

        sFiles.push(file);

        while(!sFiles.empty())
        {
            auto curFile = sFiles.top();
            sFiles.pop();

            for(auto require : curFile->fileRequires)
            {
                sFiles.push(require);
            }

            result.push_front(curFile);
        }

        return result;
    }
    // Удаляет вершину графа (то есть информацию о файле в графе)
    void removeEdge(std::shared_ptr<FileNode> edge)
    {
        // Удаляем сначала нод зависимости
        this->files.remove(edge);
    }
    
    // Функция, которая вытаскивает все зависимости в один список в правильной последовательности
    std::list<std::string> extractRequires()
    {
        std::list<std::string> result;

        auto files_begin = this->files.begin();

        while(files_begin != files.end())
        {   
            auto allRequires = getAllRequires(*files_begin);

            if(std::find(result.begin(), result.end(), (*files_begin)->filename) == result.end())
            {
                for(auto& require : allRequires)
                {
                    if(std::find(this->files.begin(), this->files.end(), require) == this->files.end()) continue;
                    if(std::find(result.begin(), result.end(), require->filename) != result.end()) continue;

                    result.push_back(require->filename);
                }
            }

            files_begin++;
        }

        return result;
    }
private:
    fs::path rootPath;
    std::list<std::shared_ptr<FileNode>> files;

    bool hasCycle(std::shared_ptr<FileNode> file, std::list<std::shared_ptr<FileNode>>& visited, std::list<std::shared_ptr<FileNode>>& recStack)
    {
        visited.push_back(file);
        recStack.push_back(file);

        for(auto& require : file->fileRequires)
        {
            if(std::find(visited.begin(), visited.end(), require) == visited.end())
            {
                if(hasCycle(require, visited, recStack))
                {
                    return true;
                }
            }
            else if(std::find(recStack.begin(), recStack.end(), require) != recStack.end())
            {
                return true;
            }
        }

        recStack.remove(file);

        return false;
    }
};

// Утилита объединения сорержимого файлов по порядку
void concatFiles(std::list<std::string>& filenames, fs::path resultFilename)
{
    std::ofstream resultFile{resultFilename};

    for(auto& filename : filenames)
    {
        std::ifstream file{filename};
        std::string line;

        while(getline(file, line)) 
        {   
            bool match = std::regex_match(line, requireKeyRegex);

            if(match || line == "")
            {
                continue;
                // line = std::regex_replace(line, e, "");
            }

            resultFile << line << "\n";
        }

    }
}

// Удаляет расширение у файлов
std::list<std::string> removeFileExt(std::list<std::shared_ptr<FileNode>>& filenames)
{
    std::list<std::string> result{};

    for(auto& file : filenames)
    {
        std::string el = std::regex_replace(file->filename, txtFileRegex, "");
        result.push_back(el);
    }

    return result;
}

void removeFileExt(std::list<std::string> filenames)
{
    std::for_each(filenames.begin(), filenames.end(), [](std::string& el)
    {
        el = std::regex_replace(el, txtFileRegex, "");
    });
}

int main(int argc, char** args)
{
    std::string strRootPath;

    std::cout << "Enter root path [ absolute or relative path] or press enter to default root path [ './task1' ]\nroot path: "; std::getline(std::cin, strRootPath);

    fs::path rootPath;
    fs::path resultFile{"./result-task1.txt"};

    if(strRootPath == "") rootPath = "./task1/";
    else rootPath = strRootPath;

    if(!fs::exists(rootPath))
    {
        std::cout << "Directory is inaccessible or does not exist" << std::endl;

        return 0;
    }

    DirectoryGraph filesystem(rootPath);

    filesystem.loadDirectory();
    filesystem.loadRequires();

    auto hasCycle = filesystem.hasCycle();

    if(std::get<0>(hasCycle))
    {
        std::cout << "There is a cyclical dependency" << std:: endl;
        std::cout << "The following files cause a circular dependency: " << std::endl;

        std::list<std::string> cycle = removeFileExt(std::get<1>(hasCycle));

        std::for_each(cycle.begin(), cycle.end(), [](auto& el)
        {
            std::cout << el << std::endl;
        });
        
        return 1; 
    }

    filesystem.sortFiles();

    std::list<std::string> resultList = filesystem.extractRequires();
    removeFileExt(resultList);

    concatFiles(resultList, resultFile);

    // Выводим список файлов
    std::for_each(resultList.begin(), resultList.end(), [](std::string el)
    {
        std::string result = std::regex_replace(el, txtFileRegex, "");
        std::cout << result << std::endl;
    });

    return 0;
}