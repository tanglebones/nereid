some conventions:
* tables are singular
* id's are always prefixed by the table name (even in the table itself) to enable USING
* a_1_b is an optional attribute table (one or zero b per a)
* a_e_b is an extension table (exactly one b per a, PITA to handle case)
* a_n_b is a detail table (many b per a)
* a_x_b is an xref table (many b to many b)
