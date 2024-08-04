cmake_minimum_required(VERSION 3.28)
project(cmake_server)

set(CMAKE_CXX_STANDARD 17)
set(SERVER_SOURCE ./server.cpp)
file(GLOB CORE_SOURCES "./core/*.cpp")
set(ALL_SOURCES ${SERVER_SOURCE} ${CORE_SOURCES})

add_executable(server ${ALL_SOURCES})

set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} "${CMAKE_SOURCE_DIR}/cmake/Modules/")

find_package(Crow REQUIRED)

target_link_libraries(server PUBLIC pthread)
target_link_libraries(server PUBLIC sqlite3)
target_link_libraries(server PUBLIC Crow::Crow)

include_directories(${CMAKE_SOURCE_DIR}/core)
